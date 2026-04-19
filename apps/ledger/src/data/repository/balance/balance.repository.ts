import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { EntityManager, DataSource, Brackets } from 'typeorm'
import { UUID, Numeric, IntegrationAccount, IntegrationCurrency, RawNumeric } from '@app/types'
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
} from './balance-repository.types'
import { BalanceChangeData } from '../../../module/balance/model/balance-change.data'

interface ProjectionSnapshot {
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

@Injectable()
export class BalanceRepository {
  constructor(@InjectDataSource(LedgerPostgresConfig.DATASOURCE_NAME) private readonly datasource: DataSource) {}

  async applyFromChanges(changes: ReadonlyArray<BalanceChangeData>, ctx: TxContext): Promise<void> {
    const em = this.resolveEntityManager(ctx)

    // 1. Collect unique projection keys that will be touched

    const integrationKeys = this.collectIntegrationKeys(changes)
    const platformKeys = this.collectPlatformKeys(changes)

    // 2. Pessimistic lock both projection tables in deterministic order
    //       Single query across both tables ordered by id prevents deadlocks.

    await this.lockProjections(em, integrationKeys, platformKeys)

    // 3. Apply each change — ES insert + projection update
    //  Wallet-bound changes first, then user-only changes.

    for (const change of changes) {
      await this.applyChange(em, change)
    }
  }

  async applyFromGroups(groups: ReadonlyArray<IntentGroup>, ctx: TxContext): Promise<ReadonlyArray<IntentApplyResult>> {
    const em = this.resolveEntityManager(ctx)

    const allChanges = groups.flatMap((g) => g.changes)
    const integrationKeys = this.collectIntegrationKeys(allChanges)
    const platformKeys = this.collectPlatformKeys(allChanges)

    await this.lockProjections(em, integrationKeys, platformKeys)

    const [integrationSnapshots, platformSnapshots] = await Promise.all([
      this.readIntegrationSnapshots(em, integrationKeys),
      this.readPlatformSnapshots(em, platformKeys),
    ])

    const results: IntentApplyResult[] = []

    for (const group of groups) {
      const error = this.applyGroupToSnapshots(group, integrationSnapshots, platformSnapshots)

      if (error !== null) {
        results.push({ status: 'failed', intentId: group.intentId, changes: group.changes, error })
        continue
      }

      for (const change of group.changes) {
        await this.applyChange(em, change)
      }

      results.push({ status: 'success', intentId: group.intentId, changes: group.changes })
    }

    return results
  }

  private applyGroupToSnapshots(
    group: IntentGroup,
    integrationSnapshots: Map<string, ProjectionSnapshot>,
    platformSnapshots: Map<string, ProjectionSnapshot>,
  ): BalanceApplyError | null {
    const integrationPending = new Map<string, ProjectionSnapshot>()
    const platformPending = new Map<string, ProjectionSnapshot>()

    for (const change of group.changes) {
      const delta = this.computeDelta(change)

      if (change.integrationAccount !== null) {
        const key = `${change.integrationAccount}|${change.integration}|${change.currency}`
        const snapshot = integrationPending.get(key) ?? integrationSnapshots.get(key)!

        if (snapshot === undefined) {
          throw new Error(
            `Projection snapshot not found for integration account: ${change.integrationAccount}, integration: ${change.integration}, currency: ${change.currency}`,
          )
        }

        const next = {
          available: snapshot.available.add(delta.available),
          hold: snapshot.hold.add(delta.hold),
          holdIn: snapshot.holdIn.add(delta.holdIn),
        }

        if (next.available.isNegative() || next.hold.isNegative() || next.holdIn.isNegative()) {
          return {
            code: 'INSUFFICIENT_FUNDS',
            platformAccountId: change.platformAccountId,
            integrationAccount: change.integrationAccount,
            available: snapshot.available,
            required: delta.available.negated(),
          }
        }

        integrationPending.set(key, next)
      }

      if (change.platformAccountId !== null) {
        const key = `${change.platformAccountId}|${change.integration}|${change.currency}`
        const snapshot = platformPending.get(key) ?? platformSnapshots.get(key)!

        if (snapshot === undefined) {
          throw new Error(
            `Projection snapshot not found for platform account: ${change.platformAccountId}, integration: ${change.integration}, currency: ${change.currency}`,
          )
        }

        const next = {
          available: snapshot.available.add(delta.available),
          hold: snapshot.hold.add(delta.hold),
          holdIn: snapshot.holdIn.add(delta.holdIn),
        }

        if (next.available.isNegative() || next.hold.isNegative() || next.holdIn.isNegative()) {
          return {
            code: 'INSUFFICIENT_FUNDS',
            platformAccountId: change.platformAccountId,
            integrationAccount: change.integrationAccount,
            available: snapshot.available,
            required: delta.available.negated(),
          }
        }

        platformPending.set(key, next)
      }
    }

    for (const [key, snapshot] of integrationPending) {
      integrationSnapshots.set(key, snapshot)
    }

    for (const [key, snapshot] of platformPending) {
      platformSnapshots.set(key, snapshot)
    }

    return null
  }

  private async applyChange(em: EntityManager, change: BalanceChangeData): Promise<void> {
    const delta = this.computeDelta(change)

    if (change.integrationAccount !== null) {
      const snapshot = await this.upsertIntegrationProjection(em, change, delta)
      await this.insertIntegrationEs(em, change, snapshot)
    }

    if (change.platformAccountId !== null) {
      const snapshot = await this.upsertPlatformProjection(em, change, delta)
      await this.insertPlatformEs(em, change, snapshot)
    }
  }

  private async readIntegrationSnapshots(
    em: EntityManager,
    keys: ReadonlyArray<IntegrationAccountKey>,
  ): Promise<Map<string, ProjectionSnapshot>> {
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
  ): Promise<Map<string, ProjectionSnapshot>> {
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

  private async insertIntegrationEs(
    em: EntityManager,
    change: BalanceChangeData,
    snapshot: ProjectionSnapshot,
  ): Promise<void> {
    await em.insert(IntegrationAccountEsEntity, {
      account: change.integrationAccount!,
      integration: change.integration,
      currency: change.currency,
      changeType: change.type,
      amount: change.amount,
      intentType: change.intentType ?? null,
      intentId: change.intentId ?? null,
      intentOperationType: change.operationType ?? null,
      metadata: change.metadata,
      availableAfter: snapshot.available,
      holdAfter: snapshot.hold,
      holdInAfter: snapshot.holdIn,
    })
  }

  private async insertPlatformEs(
    em: EntityManager,
    change: BalanceChangeData,
    snapshot: ProjectionSnapshot,
  ): Promise<void> {
    await em.insert(PlatformAccountEsEntity, {
      accountId: change.platformAccountId!,
      integration: change.integration,
      currency: change.currency,
      changeType: change.type,
      amount: change.amount,
      intentType: change.intentType ?? null,
      intentId: change.intentId ?? null,
      intentOperationType: change.operationType ?? null,
      metadata: change.metadata,
      availableAfter: snapshot.available,
      holdAfter: snapshot.hold,
      holdInAfter: snapshot.holdIn,
    })
  }

  private async upsertIntegrationProjection(
    em: EntityManager,
    change: BalanceChangeData,
    delta: ProjectionDelta,
  ): Promise<ProjectionSnapshot> {
    const result: [row: { available: RawNumeric; hold: RawNumeric; hold_in: RawNumeric }[], count: number] =
      await em.query(
        `UPDATE ${APP_SCHEMA}.${IntegrationAccountProjectionEntity.NAME}
         SET available = available + ${this.numericLiteral(delta.available)},
             hold      = hold + ${this.numericLiteral(delta.hold)},
             hold_in   = hold_in + ${this.numericLiteral(delta.holdIn)}
         WHERE account = $1
           AND integration = $2
           AND currency = $3 RETURNING available, hold, hold_in`,
        [change.integrationAccount!, change.integration, change.currency],
      )

    const row = (result[0] ?? [])[0]

    return {
      available: Numeric.create(row.available),
      hold: Numeric.create(row.hold),
      holdIn: Numeric.create(row.hold_in),
    }
  }

  private async upsertPlatformProjection(
    em: EntityManager,
    change: BalanceChangeData,
    delta: ProjectionDelta,
  ): Promise<ProjectionSnapshot> {
    const result: [row: { available: RawNumeric; hold: RawNumeric; hold_in: RawNumeric }[], count: number] =
      await em.query(
        `UPDATE ${APP_SCHEMA}.${PlatformAccountProjectionEntity.NAME}
         SET available = available + ${this.numericLiteral(delta.available)},
             hold      = hold + ${this.numericLiteral(delta.hold)},
             hold_in   = hold_in + ${this.numericLiteral(delta.holdIn)}
         WHERE account_id = $1
           AND integration = $2
           AND currency = $3 RETURNING available, hold, hold_in`,
        [change.platformAccountId!, change.integration, change.currency],
      )

    const row = (result[0] ?? [])[0]

    return {
      available: Numeric.create(row.available),
      hold: Numeric.create(row.hold),
      holdIn: Numeric.create(row.hold_in),
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
