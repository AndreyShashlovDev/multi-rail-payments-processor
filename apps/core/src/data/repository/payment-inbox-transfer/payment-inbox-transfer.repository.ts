import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { DataSource } from 'typeorm'
import {
  PaymentInboxTransferData,
  PaymentInboxTransferKey,
  PaymentInboxTransferModel,
} from '../../../module/payment-intent/model/payment-inbox-transfer.model'
import { PaymentInboxTransferRepositoryMapper } from './payment-inbox-transfer-repository.mapper'
import { TxContext } from '@app/shared/types/tx-context.type'
import { Id } from '@app/types'
import {
  PaymentInboxTransferEntity,
  PaymentInboxTransferEntityState,
} from '../../data-source/postgres/entities/payment-inbox-transfer.entity'
import { FindAndLockParams } from './payment-inbox-transaction-repository.types'

@Injectable()
export class PaymentInboxTransferRepository {
  constructor(
    @InjectDataSource(CorePostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  /**
   * Persists incoming transfers from a blockchain transaction into the inbox queue.
   *
   * Transfers are grouped by their queue key (integration:address:currency) and inserted
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
   * // Two transfers from the same transaction targeting different addresses and currencies:
   * // key=EVM:0xAAA:USDT → no blocked predecessors → state: CREATED
   * // key=EVM:0xAAA:ETH  → no blocked predecessors → state: CREATED (independent queue)
   * // key=EVM:0xBBB:USDT → has blocked predecessor → state: BLOCKED (reason: predecessor_blocked)
   */
  async insertTransfers(transfers: ReadonlyArray<PaymentInboxTransferData>): Promise<void> {
    const byKey = Map.groupBy(transfers, (transfer) =>
      PaymentInboxTransferKey.create(transfer.integration, transfer.to, transfer.currency),
    )

    for (const [key, group] of byKey) {
      await this.datasource.transaction(async (manager) => {
        await manager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [key])

        const hasBlocked = await manager
          .createQueryBuilder(PaymentInboxTransferEntity, 'it')
          .where('it.key = :key', { key })
          .andWhere('it.state = :state', { state: PaymentInboxTransferEntityState.BLOCKED })
          .getExists()

        const state = hasBlocked ? PaymentInboxTransferEntityState.BLOCKED : PaymentInboxTransferEntityState.CREATED

        const reason = hasBlocked ? 'predecessor_blocked' : null

        const values = group.map((transfer) => {
          const entity = PaymentInboxTransferRepositoryMapper.fromDomain(transfer, manager)
          return { ...entity, key, state, reason }
        })

        await manager.createQueryBuilder().insert().into(PaymentInboxTransferEntity).values(values).orIgnore().execute()
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
   * // Keys in inbox: EVM:0xAAA:USDT, EVM:0xAAA:ETH, EVM:0xBBB:USDT
   * // Instance A locks: EVM:0xAAA:USDT, EVM:0xBBB:USDT
   * // Instance B locks: EVM:0xAAA:ETH (others are skipped)
   * // Both instances work in parallel without interfering with each other.
   *
   * @returns A set of locked keys exclusively owned by the current instance for this transaction.
   */
  async findAndLockAvailableKeys(
    params: FindAndLockParams,
    ctx: TxContext,
  ): Promise<ReadonlySet<PaymentInboxTransferKey>> {
    const whereParams: unknown[] = []

    let where = `state = ANY($1) AND deleted_at IS NULL`
    whereParams.push([PaymentInboxTransferEntityState.CREATED, PaymentInboxTransferEntityState.BLOCKED])

    if (params.integration) {
      where += ` AND integration = $2`
      whereParams.push(params.integration)
    }

    const lockedRows = await ctx.em.query<{ key: string; locked: boolean }[]>(
      `SELECT key, pg_try_advisory_xact_lock(hashtext(key)) AS locked
     FROM (
       SELECT DISTINCT key
       FROM ${PaymentInboxTransferEntity.PATH}
       WHERE ${where}
       ORDER BY key
     ) keys`,
      whereParams,
    )

    const lockedKeys = lockedRows.filter(({ locked }) => locked).map(({ key }) => key as PaymentInboxTransferKey)

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
   * // Inbox state for key=EVM:0xAAA:USDT:
   * //   tx_id=1, created_at=10:00, state=BLOCKED (reason: processing_error)
   * //   tx_id=2, created_at=10:05, state=BLOCKED (reason: predecessor_blocked)
   * //   tx_id=3, created_at=10:10, state=BLOCKED (reason: predecessor_blocked)
   * //
   * // key=EVM:0xAAA:ETH:
   * //   tx_id=4, created_at=10:00, state=BLOCKED (reason: processing_error)
   * //
   * // Returns: [EVM:0xAAA:USDT tx_id=1, EVM:0xAAA:USDT tx_id=2, EVM:0xAAA:USDT tx_id=3, EVM:0xAAA:ETH tx_id=4]
   * // Note: EVM:0xAAA:USDT and EVM:0xAAA:ETH are independent queues — one does not block the other.
   */
  async findBlocked(
    keys: ReadonlySet<PaymentInboxTransferKey>,
    ctx: TxContext,
  ): Promise<ReadonlyArray<PaymentInboxTransferModel>> {
    const result = await ctx.em
      .createQueryBuilder(PaymentInboxTransferEntity, 'it')
      .where('it.key IN (:...keys)', { keys: [...keys] })
      .andWhere('it.state = :state', { state: PaymentInboxTransferEntityState.BLOCKED })
      .orderBy('it.created_at', 'ASC')
      .addOrderBy('it.tx_id', 'ASC')
      .addOrderBy('it.transfer_id', 'ASC')
      .getMany()

    return result.map((transfer) => PaymentInboxTransferRepositoryMapper.toDomain(transfer))
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
   * //   key=EVM:0xAAA:USDT → tx_id=1 BLOCKED, tx_id=2 CREATED, tx_id=3 CREATED
   * //   key=EVM:0xAAA:ETH  → tx_id=4 CREATED, tx_id=5 CREATED  (independent of USDT queue)
   * //   key=EVM:0xBBB:USDT → tx_id=6 CREATED
   * //
   * // Returns:
   * //   EVM:0xAAA:USDT → excluded (has BLOCKED)
   * //   EVM:0xAAA:ETH  → tx_id=4 only (earliest CREATED, unaffected by USDT block)
   * //   EVM:0xBBB:USDT → tx_id=6
   */
  async findNextCreated(
    keys: ReadonlySet<PaymentInboxTransferKey>,
    ctx: TxContext,
  ): Promise<ReadonlyArray<PaymentInboxTransferModel>> {
    const result = await ctx.em
      .createQueryBuilder(PaymentInboxTransferEntity, 'it')
      .where('it.key IN (:...keys)', { keys: [...keys] })
      .andWhere('it.state = :state', { state: PaymentInboxTransferEntityState.CREATED })
      .andWhere(
        `it.key NOT IN (
          SELECT DISTINCT blocked.key
          FROM ${PaymentInboxTransferEntity.PATH} blocked
          WHERE blocked.key IN (:...keys) AND blocked.state = :blockedState AND blocked.deleted_at IS NULL 
        )`,
        { keys: [...keys], blockedState: PaymentInboxTransferEntityState.BLOCKED },
      )
      .distinctOn(['it.key'])
      .orderBy('it.key', 'ASC')
      .addOrderBy('it.created_at', 'ASC')
      .addOrderBy('it.tx_id', 'ASC')
      .addOrderBy('it.transfer_id', 'ASC')
      .getMany()

    return result.map((transfer) => PaymentInboxTransferRepositoryMapper.toDomain(transfer))
  }

  /**
   * Marks a failed transfer as BLOCKED and cascades the block to all subsequent
   * CREATED transfers for the same key.
   *
   * This ensures that if a transfer fails, no later transfers for the same
   * (integration:address:currency) queue can be processed out of order, which would
   * result in incorrect balance calculations.
   *
   * Two updates are performed within the same transaction:
   * 1. The failed transfer itself → state: BLOCKED, reason: <error message>
   * 2. All CREATED transfers for the same key with id > failedId
   *    → state: BLOCKED, reason: predecessor_blocked
   *
   * @example
   * // Before:
   * //   id=1, tx_id=1 → CREATED (currently failing)
   * //   id=2, tx_id=2 → CREATED
   * //   id=3, tx_id=3 → CREATED
   * //
   * // After markBlockedWithSuccessors(id=1, key, 'intent broken'):
   * //   id=1 → BLOCKED (reason: intent broken)
   * //   id=2 → BLOCKED (reason: predecessor_blocked)
   * //   id=3 → BLOCKED (reason: predecessor_blocked)
   */
  async markBlockedWithSuccessors(id: Id, key: PaymentInboxTransferKey, reason: string, ctx: TxContext): Promise<void> {
    await ctx.em
      .createQueryBuilder()
      .update(PaymentInboxTransferEntity)
      .set({ state: PaymentInboxTransferEntityState.BLOCKED, reason })
      .where('id = :id', { id })
      .execute()

    await ctx.em
      .createQueryBuilder()
      .update(PaymentInboxTransferEntity)
      .set({
        state: PaymentInboxTransferEntityState.BLOCKED,
        reason: 'predecessor_blocked',
      })
      .where('key = :key', { key })
      .andWhere('id > :id', { id })
      .andWhere('state = :state', { state: PaymentInboxTransferEntityState.CREATED })
      .andWhere('deleted_at IS NULL')
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
  async delete(params: Pick<PaymentInboxTransferModel, 'id'>, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.softDelete(PaymentInboxTransferEntity, { id: params.id })

    return result.affected === 1
  }
}
