import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { DataSource } from 'typeorm'
import { PayoutInboxTransferRepositoryMapper } from './payout-inbox-transfer-repository.mapper'
import { TxContext } from '@app/shared/types/tx-context.type'
import { Id } from '@app/types'
import {
  PayoutInboxTransferData,
  PayoutInboxTransferKey,
  PayoutInboxTransferModel,
} from 'apps/core/src/module/payout-intent/model/payout-inbox-transfer.model'
import {
  PayoutInboxTransferEntity,
  PayoutInboxTransferEntityState,
} from '../../data-source/postgres/entities/payout-inbox-transfer.entity'
import { FindAndLockParams } from './payout-inbox-transaction-repository.types'

@Injectable()
export class PayoutInboxTransferRepository {
  constructor(
    @InjectDataSource(CorePostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  /**
   * Persists incoming transfers from a blockchain transaction into the inbox queue.
   *
   * Transfers are grouped by their queue key (integration:intentId) and inserted
   * within separate transactions to ensure atomicity per key.
   *
   * A blocking advisory lock (`pg_advisory_xact_lock`) is acquired per key before
   * inserting to prevent race conditions when multiple instances process messages
   * from JetStream simultaneously.
   *
   * State assignment logic:
   * - If any `BLOCKED` record already exists for this key → new transfers are inserted as `BLOCKED`
   *   with reason `predecessor_blocked`, preserving queue integrity.
   * - Otherwise → transfers are inserted as `CREATED`, ready for processing.
   *
   * Idempotency is guaranteed via `ON CONFLICT DO NOTHING` using a unique index on
   * (integration, tx_id, transfer_id). Re-delivered JetStream messages are safely ignored.
   *
   * @example
   * // Two transfers from the same transaction targeting different payout intents:
   * // key=EVM:uuid-AAA → no blocked predecessors → state: CREATED
   * // key=EVM:uuid-BBB → has blocked predecessor → state: BLOCKED (reason: predecessor_blocked)
   * //
   * // Same intentId across different integrations (bridge case) → independent queues:
   * // key=EVM:uuid-AAA → state: CREATED
   * // key=BSC:uuid-AAA → state: CREATED (independent, not blocked by EVM queue)
   */
  async insertTransfers(transfers: ReadonlyArray<PayoutInboxTransferData>): Promise<void> {
    const byKey = Map.groupBy(transfers, (transfer) =>
      PayoutInboxTransferKey.create(transfer.integration, transfer.intentId),
    )

    for (const [key, group] of byKey) {
      await this.datasource.transaction(async (manager) => {
        await manager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [key])

        const hasBlocked = await manager
          .createQueryBuilder(PayoutInboxTransferEntity, 'it')
          .where('it.key = :key', { key })
          .andWhere('it.state = :state', { state: PayoutInboxTransferEntityState.BLOCKED })
          .getExists()

        for (const transfer of group) {
          const entity = PayoutInboxTransferRepositoryMapper.fromDomain(transfer, manager)

          await manager
            .createQueryBuilder()
            .insert()
            .into(PayoutInboxTransferEntity)
            .values({
              ...entity,
              key,
              state: hasBlocked ? PayoutInboxTransferEntityState.BLOCKED : PayoutInboxTransferEntityState.CREATED,
              reason: hasBlocked ? 'predecessor_blocked' : null,
            })
            .orIgnore()
            .execute()
        }
      })
    }
  }

  /**
   * Finds all queue keys that have pending work and attempts to acquire a
   * non-blocking advisory lock (`pg_try_advisory_xact_lock`) on each.
   *
   * Keys that are successfully locked are returned for exclusive processing by
   * the current instance. Keys already locked by another instance are skipped,
   * ensuring that the same key is never processed concurrently.
   *
   * The advisory lock is transactional — it is automatically released when the
   * surrounding database transaction commits or rolls back. No manual unlock is needed.
   *
   * Optionally filters by integration to scope processing to a specific source.
   * When integration is null, all integrations are included (used by the fallback cron job).
   *
   * @example
   * // Keys in inbox: EVM:uuid-AAA, EVM:uuid-BBB, BSC:uuid-CCC
   * // Instance A locks: EVM:uuid-AAA, BSC:uuid-CCC
   * // Instance B locks: EVM:uuid-BBB (others are skipped)
   * // Both instances work in parallel without interfering with each other.
   *
   * @returns A set of locked keys exclusively owned by the current instance for this transaction.
   */
  async findAndLockAvailableKeys(
    params: FindAndLockParams,
    ctx: TxContext,
  ): Promise<ReadonlySet<PayoutInboxTransferKey>> {
    const whereParams: unknown[] = []

    let where = `state = ANY($1)`
    whereParams.push([PayoutInboxTransferEntityState.CREATED, PayoutInboxTransferEntityState.BLOCKED])

    if (params.integration) {
      where += ` AND integration = $2`
      whereParams.push(params.integration)
    }

    const keys = await ctx.em.query<{ key: string }[]>(
      `SELECT DISTINCT key
       FROM ${PayoutInboxTransferEntity.PATH}
       WHERE ${where}
       ORDER BY key`,
      whereParams,
    )

    const lockedKeys: PayoutInboxTransferKey[] = []

    for (const { key } of keys) {
      const [{ locked }] = await ctx.em.query<[{ locked: boolean }]>(
        `SELECT pg_try_advisory_xact_lock(hashtext($1)) AS locked`,
        [key],
      )

      if (locked) lockedKeys.push(key as PayoutInboxTransferKey)
    }

    return new Set(lockedKeys)
  }

  /**
   * Retrieves all BLOCKED transfers for the given locked keys, ordered for sequential processing.
   *
   * BLOCKED transfers are those that previously failed processing or were created after
   * a failed predecessor. They must be retried before any CREATED transfers for the same key,
   * to preserve correct ordering.
   *
   * Results are ordered by: key ASC → created_at ASC → tx_id ASC
   * This guarantees that within each key, transfers are processed in the exact order
   * they were received from the integration (blockchain order).
   *
   * Only keys acquired via `findAndLockAvailableKeys` should be passed here,
   * ensuring no concurrent access by other instances.
   *
   * @example
   * // Inbox state for key=EVM:uuid-AAA:
   * //   tx_id=1, created_at=10:00, state=BLOCKED (reason: processing_error)
   * //   tx_id=2, created_at=10:05, state=BLOCKED (reason: predecessor_blocked)
   * //   tx_id=3, created_at=10:10, state=BLOCKED (reason: predecessor_blocked)
   * //
   * // key=EVM:uuid-BBB:
   * //   tx_id=4, created_at=10:00, state=BLOCKED (reason: processing_error)
   * //
   * // Returns: [EVM:uuid-AAA tx_id=1, EVM:uuid-AAA tx_id=2, EVM:uuid-AAA tx_id=3, EVM:uuid-BBB tx_id=4]
   * // All BLOCKED transfers across all locked keys, ordered by key → created_at → tx_id
   */
  async findBlocked(
    keys: ReadonlySet<PayoutInboxTransferKey>,
    ctx: TxContext,
  ): Promise<ReadonlyArray<PayoutInboxTransferModel>> {
    const result = await ctx.em
      .createQueryBuilder(PayoutInboxTransferEntity, 'it')
      .where('it.key IN (:...keys)', { keys: [...keys] })
      .andWhere('it.state = :state', { state: PayoutInboxTransferEntityState.BLOCKED })
      .orderBy('it.key', 'ASC')
      .addOrderBy('it.created_at', 'ASC')
      .addOrderBy('it.tx_id', 'ASC')
      .getMany()

    return result.map((transfer) => PayoutInboxTransferRepositoryMapper.toDomain(transfer))
  }

  /**
   * Retrieves the earliest CREATED transfer per key, excluding keys that still have
   * BLOCKED transfers pending.
   *
   * This method implements the core ordering guarantee of the inbox pattern:
   * - Only one transfer per key is returned (the earliest by created_at + tx_id).
   * - Keys with any remaining BLOCKED transfers are fully excluded, ensuring
   *   CREATED transfers never overtake unresolved BLOCKED ones.
   *
   * Results are ordered by: key ASC → created_at ASC → tx_id ASC
   *
   * Only keys acquired via `findAndLockAvailableKeys` should be passed here.
   *
   * @limitation
   * One transfer per key is processed per processor iteration by design.
   * This guarantees ordering but may become a bottleneck under high load
   * when many transfers accumulate for the same key.
   * If this becomes an issue, consider processing multiple transfers per key
   * within a single iteration using a loop after successful apply.
   *
   * @example
   * // Inbox state:
   * //   key=EVM:uuid-AAA → tx_id=1 BLOCKED, tx_id=2 CREATED, tx_id=3 CREATED
   * //   key=EVM:uuid-BBB → tx_id=4 CREATED, tx_id=5 CREATED
   * //   key=BSC:uuid-CCC → tx_id=6 CREATED
   * //
   * // Returns:
   * //   EVM:uuid-AAA → excluded (has BLOCKED)
   * //   EVM:uuid-BBB → tx_id=4 only (earliest CREATED)
   * //   BSC:uuid-CCC → tx_id=6
   */
  async findNextCreated(
    keys: ReadonlySet<PayoutInboxTransferKey>,
    ctx: TxContext,
  ): Promise<ReadonlyArray<PayoutInboxTransferModel>> {
    const result = await ctx.em
      .createQueryBuilder(PayoutInboxTransferEntity, 'it')
      .where('it.key IN (:...keys)', { keys: [...keys] })
      .andWhere('it.state = :state', { state: PayoutInboxTransferEntityState.CREATED })
      .andWhere(
        `it.key NOT IN (
          SELECT DISTINCT blocked.key
          FROM ${PayoutInboxTransferEntity.PATH} blocked
          WHERE blocked.key IN (:...keys) AND blocked.state = :blockedState
        )`,
        { keys: [...keys], blockedState: PayoutInboxTransferEntityState.BLOCKED },
      )
      .distinctOn(['it.key'])
      .orderBy('it.key', 'ASC')
      .addOrderBy('it.created_at', 'ASC')
      .addOrderBy('it.tx_id', 'ASC')
      .getMany()

    return result.map((transfer) => PayoutInboxTransferRepositoryMapper.toDomain(transfer))
  }

  /**
   * Marks a failed transfer as BLOCKED and cascades the block to all subsequent
   * CREATED transfers for the same key.
   *
   * This ensures that if a transfer fails, no later transfers for the same
   * (integration:intentId) queue can be processed out of order, which would
   * result in incorrect balance calculations.
   *
   * Two updates are performed within the same transaction:
   * 1. The failed transfer itself → state: BLOCKED, reason: <error message>
   * 2. All CREATED transfers for the same key with created_at > failedCreatedAt
   *    → state: BLOCKED, reason: predecessor_blocked
   *
   * @example
   * // Before:
   * //   key=EVM:uuid-AAA, tx_id=1 (accepted), created_at=10:00 → CREATED (currently failing)
   * //   key=EVM:uuid-AAA, tx_id=2 (created),  created_at=10:05 → CREATED
   * //
   * // After markBlockedWithSuccessors(id of tx_id=1, key, 10:00, 'intent broken'):
   * //   key=EVM:uuid-AAA, tx_id=1 (accepted) → BLOCKED (reason: intent broken)
   * //   key=EVM:uuid-AAA, tx_id=2 (created)  → BLOCKED (reason: predecessor_blocked)
   */
  async markBlockedWithSuccessors(
    id: Id,
    key: PayoutInboxTransferKey,
    failedCreatedAt: Date,
    reason: string,
    ctx: TxContext,
  ): Promise<void> {
    await ctx.em
      .createQueryBuilder()
      .update(PayoutInboxTransferEntity)
      .set({ state: PayoutInboxTransferEntityState.BLOCKED, reason })
      .where('id = :id', { id })
      .execute()

    await ctx.em
      .createQueryBuilder()
      .update(PayoutInboxTransferEntity)
      .set({
        state: PayoutInboxTransferEntityState.BLOCKED,
        reason: 'predecessor_blocked',
      })
      .where('key = :key', { key })
      .andWhere('state = :state', { state: PayoutInboxTransferEntityState.CREATED })
      .andWhere('created_at > :createdAt', { createdAt: failedCreatedAt })
      .execute()
  }

  /**
   * Removes a successfully processed transfer from the inbox.
   *
   * Once deleted, the next transfer for the same key becomes eligible
   * for processing in the following processor iteration.
   *
   * @returns true if the record was found and deleted, false if it no longer exists
   * (e.g. already deleted by another instance — safe to ignore).
   */
  async delete(params: Pick<PayoutInboxTransferModel, 'id'>, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.delete(PayoutInboxTransferEntity, { id: params.id })

    return result.affected === 1
  }
}
