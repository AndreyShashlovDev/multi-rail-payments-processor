import { Injectable, Logger } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { EntityManager, DataSource, Brackets } from 'typeorm'
import { UUID, Numeric, IntegrationAccount, IntegrationCurrency } from '@app/types'
import {
  IntegrationType,
  BalanceChangeType,
  GetBalancesParams,
  GetPlatformAccountBalanceData,
  GetIntegrationAccountBalanceData,
} from '@app/shared'
import { LedgerPostgresConfig, APP_SCHEMA } from '../../data-source/postgres/ledger-postgres.config'
import { TxContext } from '@app/shared/types/tx-context.type'
import { IntegrationAccountEsEntity } from '../../data-source/postgres/entities/integration-account-es.entity'
import { PlatformAccountEsEntity } from '../../data-source/postgres/entities/platform-account-es.entity'
import { IntegrationAccountProjectionEntity } from '../../data-source/postgres/entities/integration-account-projection.entity'
import { PlatformAccountProjectionEntity } from '../../data-source/postgres/entities/platform-account-projection.entity'
import {
  BalanceProjectionResult,
  BalanceProjectionPlatformAccountData,
  BalanceProjectionIntegrationAccountData,
  IntentGroup,
  BalanceApplyError,
  IntentApplyResult,
  ProjectionUpdateData,
} from './balance-repository.types'
import { BalanceChangeData } from '../../../module/balance/model/balance-change.data'

interface ProjectionSnapshot {
  readonly account: IntegrationAccount
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
  readonly available: Numeric
  readonly hold: Numeric
  readonly holdIn: Numeric
}

interface ProjectionDelta {
  readonly available: Numeric
  readonly hold: Numeric
  readonly holdIn: Numeric
}

interface IntegrationAccountKey {
  readonly account: IntegrationAccount
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
}

interface PlatformAccountKey {
  readonly accountId: UUID
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
}

type ApplyGroupResult =
  | Readonly<{
      ok: true
      integrationUpdates: Map<string, ProjectionSnapshot>
      platformUpdates: Map<string, ProjectionSnapshot>
    }>
  | Readonly<{ ok: false; error: BalanceApplyError }>

@Injectable()
export class BalanceRepository {
  private readonly logger = new Logger(BalanceRepository.name)

  constructor(@InjectDataSource(LedgerPostgresConfig.DATASOURCE_NAME) private readonly datasource: DataSource) {}

  async applyFromGroups(groups: ReadonlyArray<IntentGroup>, ctx: TxContext): Promise<ReadonlyArray<IntentApplyResult>> {
    const em = this.resolveEntityManager(ctx)

    const allChanges = groups.flatMap((g) => g.changes)
    const integrationKeys = this.collectIntegrationKeys(allChanges)
    const platformKeys = this.collectPlatformKeys(allChanges)

    await this.lockProjections(em, integrationKeys, platformKeys)

    const integrationSnapshots = await this.readIntegrationSnapshots(em, integrationKeys)
    const platformSnapshots = await this.readPlatformSnapshots(em, platformKeys)

    const results: IntentApplyResult[] = []
    const successChanges: BalanceChangeData[] = []

    let workingIntegration = new Map(integrationSnapshots)
    let workingPlatform = new Map(platformSnapshots)

    for (const group of groups) {
      const result = this.applyGroupToSnapshots(group, workingIntegration, workingPlatform)

      if (!result.ok) {
        results.push({ status: 'failed', intentId: group.intentId, changes: group.changes, error: result.error })
        continue
      }

      workingIntegration = new Map([...workingIntegration, ...result.integrationUpdates])
      workingPlatform = new Map([...workingPlatform, ...result.platformUpdates])

      successChanges.push(...group.changes)

      const updates: ProjectionUpdateData[] = Array.from(result.integrationUpdates.values()).concat(
        Array.from(result.platformUpdates.values()),
      )

      results.push({ status: 'success', intentId: group.intentId, changes: group.changes, updates })
    }

    if (successChanges.length > 0) {
      await this.batchUpsertIntegrationProjections(em, successChanges)
      await this.batchUpsertPlatformProjections(em, successChanges)
      await this.batchInsertEs(em, successChanges, integrationSnapshots, platformSnapshots)
    }

    return results
  }

  private async batchUpsertIntegrationProjections(
    em: EntityManager,
    changes: ReadonlyArray<BalanceChangeData>,
  ): Promise<void> {
    // Агрегируем дельты по ключу — несколько changes на один аккаунт суммируем
    const deltaMap = new Map<string, { key: IntegrationAccountKey; delta: ProjectionDelta }>()

    for (const change of changes) {
      if (change.integrationAccount === null) continue

      const key = `${change.integrationAccount}|${change.integration}|${change.currency}`
      const delta = this.computeDelta(change)

      if (deltaMap.has(key)) {
        const existing = deltaMap.get(key)!
        deltaMap.set(key, {
          key: existing.key,
          delta: {
            available: existing.delta.available.add(delta.available),
            hold: existing.delta.hold.add(delta.hold),
            holdIn: existing.delta.holdIn.add(delta.holdIn),
          },
        })
      } else {
        deltaMap.set(key, {
          key: {
            account: change.integrationAccount,
            integration: change.integration,
            currency: change.currency,
          },
          delta,
        })
      }
    }

    if (deltaMap.size === 0) return

    const entries = Array.from(deltaMap.values())
    const params: unknown[] = []
    const valueParts: string[] = []

    for (const { key, delta } of entries) {
      params.push(key.account, key.integration, key.currency)
      const base = params.length - 3
      valueParts.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, ` +
          `${this.numericLiteral(delta.available)}, ` +
          `${this.numericLiteral(delta.hold)}, ` +
          `${this.numericLiteral(delta.holdIn)})`,
      )
    }

    await em.query(
      `UPDATE ${APP_SCHEMA}.${IntegrationAccountProjectionEntity.NAME} AS p
       SET available = p.available + v.available,
           hold      = p.hold + v.hold,
           hold_in   = p.hold_in + v.hold_in FROM (VALUES ${valueParts.join(', ')})
         AS v(account, integration, currency, available, hold, hold_in)
       WHERE p.account = v.account
         AND p.integration = v.integration
         AND p.currency = v.currency`,
      params,
    )
  }

  private async batchUpsertPlatformProjections(
    em: EntityManager,
    changes: ReadonlyArray<BalanceChangeData>,
  ): Promise<void> {
    const deltaMap = new Map<string, { key: PlatformAccountKey; delta: ProjectionDelta }>()

    for (const change of changes) {
      if (change.platformAccountId === null) continue

      const key = `${change.platformAccountId}|${change.integration}|${change.currency}`
      const delta = this.computeDelta(change)

      if (deltaMap.has(key)) {
        const existing = deltaMap.get(key)!
        deltaMap.set(key, {
          key: existing.key,
          delta: {
            available: existing.delta.available.add(delta.available),
            hold: existing.delta.hold.add(delta.hold),
            holdIn: existing.delta.holdIn.add(delta.holdIn),
          },
        })
      } else {
        deltaMap.set(key, {
          key: {
            accountId: change.platformAccountId,
            integration: change.integration,
            currency: change.currency,
          },
          delta,
        })
      }
    }

    if (deltaMap.size === 0) return

    const entries = Array.from(deltaMap.values())
    const params: unknown[] = []
    const valueParts: string[] = []

    for (const { key, delta } of entries) {
      params.push(key.accountId, key.integration, key.currency)
      const base = params.length - 3
      valueParts.push(
        `($${base + 1}::uuid, $${base + 2}, $${base + 3}, ` +
          `${this.numericLiteral(delta.available)}, ` +
          `${this.numericLiteral(delta.hold)}, ` +
          `${this.numericLiteral(delta.holdIn)})`,
      )
    }

    await em.query(
      `UPDATE ${APP_SCHEMA}.${PlatformAccountProjectionEntity.NAME} AS p
       SET available = p.available + v.available,
           hold      = p.hold + v.hold,
           hold_in   = p.hold_in + v.hold_in FROM (VALUES ${valueParts.join(', ')})
         AS v(account_id, integration, currency, available, hold, hold_in)
       WHERE p.account_id = v.account_id
         AND p.integration = v.integration
         AND p.currency = v.currency`,
      params,
    )
  }

  private async batchInsertEs(
    em: EntityManager,
    changes: ReadonlyArray<BalanceChangeData>,
    integrationSnapshots: ReadonlyMap<string, ProjectionSnapshot>,
    platformSnapshots: ReadonlyMap<string, ProjectionSnapshot>,
  ): Promise<void> {
    const integrationCurrent = new Map(integrationSnapshots)
    const platformCurrent = new Map(platformSnapshots)

    const integrationRows: object[] = []
    const platformRows: object[] = []

    for (const change of changes) {
      const delta = this.computeDelta(change)

      if (change.integrationAccount !== null) {
        const key = `${change.integrationAccount}|${change.integration}|${change.currency}`
        const snapshot = integrationCurrent.get(key)!

        // Вычисляем состояние после текущего change
        const after: ProjectionSnapshot = {
          account: change.integrationAccount,
          integration: change.integration,
          currency: change.currency,
          available: snapshot.available.add(delta.available),
          hold: snapshot.hold.add(delta.hold),
          holdIn: snapshot.holdIn.add(delta.holdIn),
        }

        integrationRows.push({
          account: change.integrationAccount,
          integration: change.integration,
          currency: change.currency,
          changeType: change.type,
          amount: change.amount,
          intentType: change.intentType ?? null,
          intentId: change.intentId ?? null,
          intentOperationType: change.operationType ?? null,
          metadata: change.metadata,
          availableAfter: after.available,
          holdAfter: after.hold,
          holdInAfter: after.holdIn,
        })

        integrationCurrent.set(key, after)
      }

      if (change.platformAccountId !== null) {
        const key = `${change.platformAccountId}|${change.integration}|${change.currency}`
        const snapshot = platformCurrent.get(key)!

        const after: ProjectionSnapshot = {
          account: change.platformAccountId as IntegrationAccount,
          integration: change.integration,
          currency: change.currency,
          available: snapshot.available.add(delta.available),
          hold: snapshot.hold.add(delta.hold),
          holdIn: snapshot.holdIn.add(delta.holdIn),
        }

        platformRows.push({
          accountId: change.platformAccountId,
          integration: change.integration,
          currency: change.currency,
          changeType: change.type,
          amount: change.amount,
          intentType: change.intentType ?? null,
          intentId: change.intentId ?? null,
          intentOperationType: change.operationType ?? null,
          metadata: change.metadata,
          availableAfter: after.available,
          holdAfter: after.hold,
          holdInAfter: after.holdIn,
        })

        platformCurrent.set(key, after)
      }
    }

    if (integrationRows.length > 0) {
      await em.insert(IntegrationAccountEsEntity, integrationRows)
    }
    if (platformRows.length > 0) {
      await em.insert(PlatformAccountEsEntity, platformRows)
    }
  }

  private applyGroupToSnapshots(
    group: IntentGroup,
    integrationSnapshots: ReadonlyMap<string, ProjectionSnapshot>,
    platformSnapshots: ReadonlyMap<string, ProjectionSnapshot>,
  ): ApplyGroupResult {
    const integrationPending = new Map<string, ProjectionSnapshot>()
    const platformPending = new Map<string, ProjectionSnapshot>()

    for (const change of group.changes) {
      const delta = this.computeDelta(change)

      if (change.integrationAccount !== null) {
        const key = `${change.integrationAccount}|${change.integration}|${change.currency}`
        const snapshot = integrationPending.get(key) ?? integrationSnapshots.get(key)!

        if (snapshot === undefined) {
          throw new Error(`Projection snapshot not found for integration account: ${change.integrationAccount}`)
        }

        const next: ProjectionSnapshot = {
          account: change.integrationAccount,
          integration: change.integration,
          currency: change.currency,
          available: snapshot.available.add(delta.available),
          hold: snapshot.hold.add(delta.hold),
          holdIn: snapshot.holdIn.add(delta.holdIn),
        }

        if (next.available.isNegative() || next.hold.isNegative() || next.holdIn.isNegative()) {
          return {
            ok: false,
            error: {
              code: 'INSUFFICIENT_FUNDS',
              platformAccountId: change.platformAccountId,
              integrationAccount: change.integrationAccount,
              available: snapshot.available,
              required: delta.available.negated(),
            },
          }
        }

        integrationPending.set(key, next)
      }

      if (change.platformAccountId !== null) {
        const key = `${change.platformAccountId}|${change.integration}|${change.currency}`
        const snapshot = platformPending.get(key) ?? platformSnapshots.get(key)!

        if (snapshot === undefined) {
          throw new Error(`Projection snapshot not found for platform account: ${change.platformAccountId}`)
        }

        const next: ProjectionSnapshot = {
          account: change.platformAccountId as IntegrationAccount,
          integration: change.integration,
          currency: change.currency,
          available: snapshot.available.add(delta.available),
          hold: snapshot.hold.add(delta.hold),
          holdIn: snapshot.holdIn.add(delta.holdIn),
        }

        if (next.available.isNegative() || next.hold.isNegative() || next.holdIn.isNegative()) {
          return {
            ok: false,
            error: {
              code: 'INSUFFICIENT_FUNDS',
              platformAccountId: change.platformAccountId,
              integrationAccount: change.integrationAccount,
              available: snapshot.available,
              required: delta.available.negated(),
            },
          }
        }

        platformPending.set(key, next)
      }
    }

    return { ok: true, integrationUpdates: integrationPending, platformUpdates: platformPending }
  }

  private async readIntegrationSnapshots(
    em: EntityManager,
    keys: ReadonlyArray<IntegrationAccountKey>,
  ): Promise<ReadonlyMap<string, ProjectionSnapshot>> {
    if (keys.length === 0) return new Map()

    const result = await em
      .createQueryBuilder(IntegrationAccountProjectionEntity, 'i')
      .where(
        new Brackets((qb) => {
          keys.forEach((k, index) => {
            qb.orWhere(
              `i.account = :account${index} AND i.integration = :integration${index} AND i.currency = :currency${index}`,
              {
                [`account${index}`]: k.account,
                [`integration${index}`]: k.integration,
                [`currency${index}`]: k.currency,
              },
            )
          })
        }),
      )
      .getMany()

    return new Map(
      result.map((row) => [
        `${row.account}|${row.integration}|${row.currency}`,
        {
          account: row.account,
          integration: row.integration,
          currency: row.currency,
          available: Numeric.create(row.available),
          hold: Numeric.create(row.hold),
          holdIn: Numeric.create(row.holdIn),
        },
      ]),
    )
  }

  private async readPlatformSnapshots(
    em: EntityManager,
    keys: ReadonlyArray<PlatformAccountKey>,
  ): Promise<ReadonlyMap<string, ProjectionSnapshot>> {
    if (keys.length === 0) return new Map()

    const result = await em
      .createQueryBuilder(PlatformAccountProjectionEntity, 'p')
      .where(
        new Brackets((qb) => {
          keys.forEach((k, index) => {
            qb.orWhere(
              `p.accountId = :accountId${index} AND p.integration = :integration${index} AND p.currency = :currency${index}`,
              {
                [`accountId${index}`]: k.accountId,
                [`integration${index}`]: k.integration,
                [`currency${index}`]: k.currency,
              },
            )
          })
        }),
      )
      .getMany()

    return new Map(
      result.map((row) => [
        `${row.accountId}|${row.integration}|${row.currency}`,
        {
          account: row.accountId as IntegrationAccount,
          integration: row.integration,
          currency: row.currency,
          available: Numeric.create(row.available),
          hold: Numeric.create(row.hold),
          holdIn: Numeric.create(row.holdIn),
        },
      ]),
    )
  }

  private computeDelta(change: BalanceChangeData): ProjectionDelta {
    const zero = Numeric.ZERO
    const amount = change.amount

    switch (change.type) {
      case BalanceChangeType.CREDIT:
        // balance+, available+
        return { available: amount, hold: zero, holdIn: zero }

      case BalanceChangeType.DEBIT:
        // balance-, available-
        return { available: amount.negated(), hold: zero, holdIn: zero }

      case BalanceChangeType.HOLD:
        // available-, hold+
        return { available: amount.negated(), hold: amount, holdIn: zero }

      case BalanceChangeType.RELEASE_HOLD:
        // available+, hold-
        return { available: amount, hold: amount.negated(), holdIn: zero }

      case BalanceChangeType.HOLD_IN:
        // balance+, holdIn+ (available не меняется — деньги pending)
        // available = balance - hold - holdIn → баланс растёт, holdIn растёт → available не меняется
        return { available: zero, hold: zero, holdIn: amount }

      case BalanceChangeType.RELEASE_HOLD_IN:
        // balance-, holdIn- (CREDIT придёт следом и добавит в available)
        return { available: zero, hold: zero, holdIn: amount.negated() }

      case BalanceChangeType.PLATFORM_FEE_ACCRUED:
        // Семантически то же что HOLD — средства заморожены для консолидации
        // available-, hold+
        return { available: amount.negated(), hold: amount, holdIn: zero }

      default: {
        const exhaustive: never = change.type
        throw new Error(`Unknown BalanceChangeType: ${String(exhaustive)}`)
      }
    }
  }

  // pessimistic locking
  private async lockProjections(
    em: EntityManager,
    integrationKeys: ReadonlyArray<IntegrationAccountKey>,
    platformKeys: ReadonlyArray<PlatformAccountKey>,
  ): Promise<void> {
    if (integrationKeys.length === 0 && platformKeys.length === 0) return

    // Ensure rows exist before locking — orIgnore() is safe here
    await this.ensureIntegrationProjectionsExist(em, integrationKeys)
    await this.ensurePlatformProjectionsExist(em, platformKeys)

    /**
     * Lock both tables in ONE query in globally sorted id order.
     * This is the only correct way to prevent deadlock across two tables —
     * two separate FOR UPDATE queries would still race against each other.
     *
     * TypeORM doesn't support UNION ALL + FOR UPDATE so we use raw query.
     * Parameters are positional ($1, $2...) and built carefully.
     *
     * Schema: APP_SCHEMA is injected via entity table name (schema.table).
     */
    const params: string[] = []
    const parts: string[] = []

    if (integrationKeys.length > 0) {
      const conditions = integrationKeys.map((k) => {
        const base = params.length
        params.push(k.account, k.integration, k.currency)
        return `(account = $${base + 1} AND integration = $${base + 2} AND currency = $${base + 3})`
      })
      parts.push(
        `SELECT id
         FROM ${APP_SCHEMA}.${IntegrationAccountProjectionEntity.NAME}
         WHERE ${conditions.join(' OR ')}`,
      )
    }

    if (platformKeys.length > 0) {
      const conditions = platformKeys.map((k) => {
        const base = params.length
        params.push(k.accountId, k.integration, k.currency)
        return `(account_id = $${base + 1} AND integration = $${base + 2} AND currency = $${base + 3})`
      })
      parts.push(
        `SELECT id
         FROM ${APP_SCHEMA}.${PlatformAccountProjectionEntity.NAME}
         WHERE ${conditions.join(' OR ')}`,
      )
    }

    await em.query(
      `WITH _combined AS (${parts.join(' UNION ALL ')})
      SELECT id
      FROM _combined
      ORDER BY id FOR UPDATE`,
      params,
    )
  }

  private async ensureIntegrationProjectionsExist(
    em: EntityManager,
    keys: ReadonlyArray<IntegrationAccountKey>,
  ): Promise<void> {
    if (keys.length === 0) return

    await em
      .createQueryBuilder()
      .insert()
      .into(IntegrationAccountProjectionEntity)
      .values(
        keys.map((k) => ({
          account: k.account,
          integration: k.integration,
          currency: k.currency,
          available: Numeric.ZERO,
          hold: Numeric.ZERO,
          holdIn: Numeric.ZERO,
        })),
      )
      .orIgnore()
      .execute()
  }

  private async ensurePlatformProjectionsExist(
    em: EntityManager,
    keys: ReadonlyArray<PlatformAccountKey>,
  ): Promise<void> {
    if (keys.length === 0) return

    await em
      .createQueryBuilder()
      .insert()
      .into(PlatformAccountProjectionEntity)
      .values(
        keys.map((k) => ({
          accountId: k.accountId,
          integration: k.integration,
          currency: k.currency,
          available: Numeric.ZERO,
          hold: Numeric.ZERO,
          holdIn: Numeric.ZERO,
        })),
      )
      .orIgnore()
      .execute()
  }

  private collectIntegrationKeys(changes: ReadonlyArray<BalanceChangeData>): ReadonlyArray<IntegrationAccountKey> {
    const seen = new Map<string, IntegrationAccountKey>()

    for (const change of changes) {
      if (change.integrationAccount === null) continue

      const key = `${change.integrationAccount}|${change.integration}|${change.currency}`
      if (!seen.has(key)) {
        seen.set(key, {
          account: change.integrationAccount,
          integration: change.integration,
          currency: change.currency,
        })
      }
    }

    return Array.from(seen.values())
  }

  private collectPlatformKeys(changes: ReadonlyArray<BalanceChangeData>): ReadonlyArray<PlatformAccountKey> {
    const seen = new Map<string, PlatformAccountKey>()

    for (const change of changes) {
      if (change.platformAccountId === null) continue

      const key = `${change.platformAccountId}|${change.integration}|${change.currency}`
      if (!seen.has(key)) {
        seen.set(key, {
          accountId: change.platformAccountId,
          integration: change.integration,
          currency: change.currency,
        })
      }
    }

    return Array.from(seen.values())
  }

  /**
   * Converts Numeric to a safe SQL literal for use in SET expressions.
   * Uses toFixed(30) to match NumericColumn scale — avoids scientific notation.
   */
  private numericLiteral(value: Numeric): string {
    return `'${value.toFixed(30)}'::numeric`
  }

  private resolveEntityManager(ctx: TxContext): EntityManager {
    if (ctx.em.queryRunner?.isTransactionActive) {
      return ctx.em
    }
    throw new Error('BalanceRepository.applyFromChanges must be called within an active transaction')
  }

  async getProjectionBalances(params: GetBalancesParams): Promise<BalanceProjectionResult> {
    const [platform, integration] = await Promise.all([
      this.getPlatformProjectionBalances(params.platform ?? []),
      this.getIntegrationProjectionBalances(params.integration ?? []),
    ])

    return { platform, integration }
  }

  private async getPlatformProjectionBalances(
    accounts: ReadonlyArray<GetPlatformAccountBalanceData>,
  ): Promise<ReadonlyArray<BalanceProjectionPlatformAccountData>> {
    if (accounts.length === 0) return []

    const result = await this.datasource.manager
      .createQueryBuilder(PlatformAccountProjectionEntity, 'p')
      .where(
        new Brackets((qb) => {
          accounts.forEach((account, index) => {
            qb.orWhere(
              `p.accountId = :accountId${index} AND p.integration = :integration${index} AND p.currency IN (:...currencies${index})`,
              {
                [`accountId${index}`]: account.accountId,
                [`integration${index}`]: account.integration,
                [`currencies${index}`]: Array.from(account.currencies),
              },
            )
          })
        }),
      )
      .getMany()

    return result.map((entity) => ({
      accountId: entity.accountId,
      integration: entity.integration,
      currency: entity.currency,
      balance: Numeric.create(entity.available).add(entity.hold).add(entity.holdIn),
      available: Numeric.create(entity.available),
      hold: Numeric.create(entity.hold),
      holdIn: Numeric.create(entity.holdIn),
    }))
  }

  private async getIntegrationProjectionBalances(
    accounts: ReadonlyArray<GetIntegrationAccountBalanceData>,
  ): Promise<ReadonlyArray<BalanceProjectionIntegrationAccountData>> {
    if (accounts.length === 0) return []

    const result = await this.datasource.manager
      .createQueryBuilder(IntegrationAccountProjectionEntity, 'i')
      .where(
        new Brackets((qb) => {
          accounts.forEach((account, index) => {
            qb.orWhere(
              `i.account = :account${index} AND i.integration = :integration${index} AND i.currency IN (:...currencies${index})`,
              {
                [`account${index}`]: account.account,
                [`integration${index}`]: account.integration,
                [`currencies${index}`]: Array.from(account.currencies),
              },
            )
          })
        }),
      )
      .getMany()

    return result.map((entity) => ({
      account: entity.account,
      integration: entity.integration,
      currency: entity.currency,
      balance: Numeric.create(entity.available).add(entity.hold).add(entity.holdIn),
      available: Numeric.create(entity.available),
      hold: Numeric.create(entity.hold),
      holdIn: Numeric.create(entity.holdIn),
    }))
  }
}
