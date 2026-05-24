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
import { UUID, Id } from '@app/types'

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
        .where('"intent_id" = :intentId', { intentId })
        .andWhere('status = :status', { status: TransferRouteEntityStatus.CREATED })
        .execute()
    }
  }

  async getFullyHeldIntentIds(intentIds: ReadonlySet<UUID>, ctx: TxContext): Promise<ReadonlySet<Id>> {
    if (intentIds.size === 0) return new Set()

    const result = await ctx.em
      .createQueryBuilder(TransferRouteEntity, 'route')
      .select('route.transferIntentId', 'transferIntentId')
      .where('route.intentId IN (:...ids)', { ids: Array.from(intentIds) })
      .groupBy('route.transferIntentId')
      .having('COUNT(*) FILTER (WHERE route.status != :status) = 0', { status: TransferRouteEntityStatus.HELD })
      .getRawMany<{ transferIntentId: Id }>()

    return new Set(result.map((r) => r.transferIntentId))
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
}
