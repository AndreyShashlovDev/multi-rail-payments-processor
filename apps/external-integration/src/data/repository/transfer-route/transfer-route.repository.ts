import { TransferRouteData, TransferRouteModel } from '../../../shared/model/transfer-route.model'
import { TxContext } from '@app/shared'
import { TransferRouteRepositoryMapper } from './transfer-route-repository.mapper'
import {
  TransferRouteEntity,
  TransferRouteEntityStatus,
} from '../../data-source/postgres/entities/transfer-route.entity'
import { IntegrationPostgresConfig } from '../../data-source/postgres/integration-postgres.config'
import { DataSource, In } from 'typeorm'
import { InjectDataSource } from '@nestjs/typeorm'
import { Id } from '@app/types'
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere'

export class TransferRouteRepository {
  constructor(
    @InjectDataSource(IntegrationPostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  async create(data: ReadonlyArray<TransferRouteData>, ctx: TxContext): Promise<ReadonlyArray<TransferRouteModel>> {
    const em = ctx.em
    const entities = data.map((item) => TransferRouteRepositoryMapper.fromDomain(item, em))
    const result = await em.save(TransferRouteEntity, entities)

    return result.map((entity) => TransferRouteRepositoryMapper.toDomain(entity))
  }

  async markAsHeld(params: ReadonlyArray<Pick<TransferRouteData, 'intentId' | 'txId'>>, ctx: TxContext): Promise<void> {
    // todo optimize when it's really necessary
    for (const { intentId, txId } of params) {
      await ctx.em
        .createQueryBuilder()
        .update(TransferRouteEntity)
        .set({
          status: TransferRouteEntityStatus.HELD,
          transactionIntentId: txId,
        })
        .where('intent_id = :intentId', { intentId })
        .andWhere(`tx_id = :txId`, { txId })
        .andWhere('status = :status', { status: TransferRouteEntityStatus.PENDING_HOLD })
        .execute()
    }
  }

  async getFullyCompletedIntentIdByTxId(
    txId: Id,
    ctx: TxContext,
  ): Promise<Pick<TransferRouteData, 'transferIntentId'> | null> {
    const result = await ctx.em
      .createQueryBuilder(TransferRouteEntity, 'route')
      .select('route.transferIntentId', 'transferIntentId')
      .where((qb) => {
        const sub = qb
          .subQuery()
          .select('r.transferIntentId')
          .from(TransferRouteEntity, 'r')
          .where('r.txId = :txId', { txId })
          .getQuery()
        return `route.transferIntentId IN ${sub}`
      })
      .groupBy('route.transferIntentId')
      .having('COUNT(*) FILTER (WHERE route.status != :completed) = 0', {
        completed: TransferRouteEntityStatus.COMPLETED,
      })
      .getRawOne<{ transferIntentId: Id }>()

    return result?.transferIntentId ? { transferIntentId: result.transferIntentId } : null
  }

  async claimNextPendingRoutesByTxId(
    txId: Id,
    ctx: TxContext,
  ): Promise<ReadonlyArray<Pick<TransferRouteData, 'transactionIntentId'>>> {
    const routes = await ctx.em
      .createQueryBuilder(TransferRouteEntity, 'next')
      .select(['next.id', 'next.transactionIntentId'])
      .innerJoin(
        TransferRouteEntity,
        'completed',
        'completed.txId = :txId AND completed.transferIntentId = next.transferIntentId',
        { txId },
      )
      .where('next.txIndex = completed.txIndex + 1')
      .andWhere('next.status = :created', { created: TransferRouteEntityStatus.CREATED })
      .setLock('pessimistic_write')
      .setOnLocked('skip_locked')
      .getMany()

    if (routes.length === 0) return []

    await ctx.em
      .createQueryBuilder()
      .update(TransferRouteEntity)
      .set({ status: TransferRouteEntityStatus.PENDING_HOLD })
      .whereInIds(routes.map((r) => r.id))
      .execute()

    return routes
      .filter((r) => r.transactionIntentId != null)
      .map((r) => ({ transactionIntentId: r.transactionIntentId! }))
  }

  async getByTransactionIntent(
    transactionIntentIds: ReadonlySet<Id>,
    ctx?: TxContext,
  ): Promise<ReadonlyArray<TransferRouteModel>> {
    const em = ctx?.em ?? this.datasource.manager
    const result = await em.find(TransferRouteEntity, {
      where: { transactionIntentId: In(Array.from(transactionIntentIds)) },
    })

    return result.map((entity) => TransferRouteRepositoryMapper.toDomain(entity))
  }

  async markAsProcessing(txId: Id, ctx: TxContext): Promise<boolean> {
    const em = ctx.em
    const where: FindOptionsWhere<TransferRouteEntity> = {
      txId,
      status: TransferRouteEntityStatus.HELD,
    }

    const result = await em.update(TransferRouteEntity, where, { status: TransferRouteEntityStatus.IN_PROGRESS })

    return (result.affected ?? 0) > 0
  }

  async markAsCompleted(txId: Id, ctx: TxContext): Promise<boolean> {
    const em = ctx.em
    const where: FindOptionsWhere<TransferRouteEntity> = {
      txId,
      status: TransferRouteEntityStatus.IN_PROGRESS,
    }

    const result = await em.update(TransferRouteEntity, where, { status: TransferRouteEntityStatus.COMPLETED })

    return (result.affected ?? 0) > 0
  }
}
