import { OutboxData, OutboxModel, type OutboxUniqueKey } from './outbox-repository.types'
import { OutboxEntity, OutboxEntityStats } from '../../data-source/postgres/entities/outbox.entity'
import { Injectable } from '@nestjs/common'
import { PostgresAdvisoryLock } from '@app/database'
import { OutboxRepositoryMapper } from './outbox-repository.mapper'
import { TxContext, OutboxTypeOrmContext } from '@app/shared'
import { InjectDataSource } from '@nestjs/typeorm'
import { LedgerPostgresConfig } from '../../data-source/postgres/ledger-postgres.config'
import { DataSource } from 'typeorm'

@Injectable()
export class OutboxRepository {
  constructor(@InjectDataSource(LedgerPostgresConfig.DATASOURCE_NAME) private readonly datasource: DataSource) {}

  async create(data: OutboxData, ctx: TxContext): Promise<void> {
    if (!(ctx instanceof OutboxTypeOrmContext)) {
      throw new Error('OutboxRepository requires OutboxTypeOrmContext')
    }

    const entity = OutboxRepositoryMapper.fromDomain(data, ctx.em)

    await ctx.em.insert(OutboxEntity, entity)

    ctx.markOutboxWritten()
  }

  async findPending(limit: number, ctx: TxContext): Promise<OutboxModel[]> {
    const result = await ctx.em.query<{ pg_try_advisory_xact_lock: boolean }[]>(
      `SELECT pg_try_advisory_xact_lock($1)`,
      [PostgresAdvisoryLock.LEDGER_OUTBOX.key.toString()],
    )

    if (!result[0].pg_try_advisory_xact_lock) return []

    const pending = await ctx.em
      .createQueryBuilder(OutboxEntity, 'o')
      .where('o.status = :status', { status: OutboxEntityStats.PENDING })
      .orderBy('o.created_at', 'ASC')
      .limit(limit)
      .getMany()

    if (!pending.length) return []

    const ids = pending.map((item) => item.id)

    await ctx.em
      .createQueryBuilder()
      .update(OutboxEntity)
      .set({ status: OutboxEntityStats.PROCESSING, processingAt: new Date() })
      .where('id IN (:...ids)', { ids })
      .execute()

    return pending.map((item) => OutboxRepositoryMapper.toDomain(item))
  }

  async resetStuck(ctx: TxContext): Promise<void> {
    await ctx.em
      .createQueryBuilder()
      .update(OutboxEntity)
      .set({ status: OutboxEntityStats.PENDING, processingAt: null })
      .where('status = :status', { status: OutboxEntityStats.PROCESSING })
      .andWhere(`processing_at < NOW() - INTERVAL '5 minutes'`)
      .execute()
  }

  async markSent(ids: ReadonlySet<OutboxUniqueKey>, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em
      .createQueryBuilder()
      .update(OutboxEntity)
      .set({ status: OutboxEntityStats.SENT, sentAt: new Date() })
      .where('id IN (:...ids)', { ids: Array.from(ids) })
      .execute()

    return result.affected === ids.size
  }

  async incrementRetries(ids: ReadonlySet<OutboxUniqueKey>, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em
      .createQueryBuilder()
      .update(OutboxEntity)
      .set({ retries: () => 'retries + 1', status: OutboxEntityStats.PENDING, processingAt: null })
      .where('id IN (:...ids)', { ids: Array.from(ids) })
      .execute()

    return result.affected === ids.size
  }

  async deleteOld(olderThanSeconds: number): Promise<void> {
    await this.datasource.manager
      .createQueryBuilder()
      .delete()
      .from(OutboxEntity)
      .where('status = :status', { status: OutboxEntityStats.SENT })
      .andWhere(`sent_at < NOW() - INTERVAL '1 second' * :seconds`, { seconds: olderThanSeconds })
      .execute()
  }
}
