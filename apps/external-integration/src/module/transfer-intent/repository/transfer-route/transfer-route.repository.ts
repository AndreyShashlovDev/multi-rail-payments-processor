import { TransferRouteData, TransferRouteModel } from '../../model/transfer-route.model'
import { TxContext, executionTypeFromDomain, integrationTypeFromDomain } from '@app/shared'
import { TransferRouteRepositoryMapper } from './transfer-route-repository.mapper'
import {
  TransferRouteEntity,
  TransferRouteEntityStatus,
  TransferRouteEntityResult,
} from '../../../../data/data-source/postgres/entities/transfer-route.entity'
import { IntegrationPostgresConfig } from '../../../../data/data-source/postgres/integration-postgres.config'
import { DataSource } from 'typeorm'
import { InjectDataSource } from '@nestjs/typeorm'
import { Id } from '@app/types'

// Steps of one transfer intent run strictly one after another: an intent has at most one IN_PROGRESS route.
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

  // the next planned step of the intent (lowest txIndex) → IN_PROGRESS
  async claimNext(transferIntentId: Id, ctx: TxContext): Promise<TransferRouteModel | null> {
    const next = await ctx.em.findOne(TransferRouteEntity, {
      where: { transferIntentId, status: TransferRouteEntityStatus.CREATED },
      order: { txIndex: 'ASC' },
    })

    if (!next) return null

    const result = await ctx.em.update(
      TransferRouteEntity,
      { id: next.id, status: TransferRouteEntityStatus.CREATED },
      { status: TransferRouteEntityStatus.IN_PROGRESS },
    )

    if (result.affected !== 1) return null

    return TransferRouteRepositoryMapper.toDomain({ ...next, status: TransferRouteEntityStatus.IN_PROGRESS })
  }

  async getById(id: Id, ctx?: TxContext): Promise<TransferRouteModel | null> {
    const em = ctx?.em ?? this.datasource.manager
    const entity = await em.findOne(TransferRouteEntity, { where: { id } })

    return entity ? TransferRouteRepositoryMapper.toDomain(entity) : null
  }

  async markAsCompleted(params: Pick<TransferRouteModel, 'id' | 'txId' | 'result'>, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.update(
      TransferRouteEntity,
      { id: params.id, status: TransferRouteEntityStatus.IN_PROGRESS },
      {
        status: TransferRouteEntityStatus.COMPLETED,
        txId: params.txId,
        result: params.result as TransferRouteEntityResult | null,
      },
    )

    return result.affected === 1
  }

  async getCompleted(transferIntentId: Id, ctx: TxContext): Promise<ReadonlyArray<TransferRouteModel>> {
    const entities = await ctx.em.find(TransferRouteEntity, {
      where: { transferIntentId, status: TransferRouteEntityStatus.COMPLETED },
      order: { txIndex: 'ASC' },
    })

    return entities.map((entity) => TransferRouteRepositoryMapper.toDomain(entity))
  }

  // stores the step parameters resolved right before the step is started (see TransferRoutePlanner.resolveNext)
  async saveResolved(route: TransferRouteModel, ctx: TxContext): Promise<void> {
    await ctx.em.update(
      TransferRouteEntity,
      { id: route.id, status: TransferRouteEntityStatus.IN_PROGRESS },
      {
        executionType: executionTypeFromDomain(route.executionType),
        integration: integrationTypeFromDomain(route.integration),
        initiator: route.initiator,
        fromAccount: route.fromAccount,
        toAccount: route.toAccount,
        rawAmount: route.rawAmount,
        currency: route.currency,
      },
    )
  }

  async markAsFailed(id: Id, ctx: TxContext): Promise<boolean> {
    return await this.changeInProgressStatus(id, TransferRouteEntityStatus.FAILED, ctx)
  }

  async isAllCompleted(transferIntentId: Id, ctx: TxContext): Promise<boolean> {
    const notCompleted = await ctx.em
      .createQueryBuilder(TransferRouteEntity, 'route')
      .where('route.transferIntentId = :transferIntentId', { transferIntentId })
      .andWhere('route.status != :completed', { completed: TransferRouteEntityStatus.COMPLETED })
      .getCount()

    return notCompleted === 0
  }

  private async changeInProgressStatus(id: Id, status: TransferRouteEntityStatus, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.update(
      TransferRouteEntity,
      { id, status: TransferRouteEntityStatus.IN_PROGRESS },
      { status },
    )

    return result.affected === 1
  }
}
