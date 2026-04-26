import { Injectable } from '@nestjs/common'
import {
  TransferIntentData,
  TransferIntentModel,
  TransferIntentStatus,
} from '../../../module/transfer-intent/model/transfer-intent.model'
import { TransferIntentRepositoryMapper } from './transfer-intent-repository.mapper'
import { InjectDataSource } from '@nestjs/typeorm'
import { IntegrationPostgresConfig } from '../../data-source/postgres/integration-postgres.config'
import { DataSource, In } from 'typeorm'
import {
  TransferIntentEntity,
  TransferIntentEntityStatus,
} from '../../data-source/postgres/entities/transfer-intent.entity'
import { TxContext } from '@app/shared/types/tx-context.type'
import { Id } from '@app/types'
import { MarkAsPreparedParams, MarkAsProcessingParams } from './transfer-intent-repository.types'
import { intentTypeFromDomain } from '@app/shared'

@Injectable()
export class TransferIntentRepository {
  constructor(
    @InjectDataSource(IntegrationPostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  async create(
    data: Omit<TransferIntentData, 'status' | 'transactionIntentId'>,
    ctx: TxContext,
  ): Promise<TransferIntentModel> {
    const entity = TransferIntentRepositoryMapper.fromDomain(
      { ...data, status: TransferIntentStatus.CREATED, transactionIntentId: null },
      this.datasource.manager,
    )

    const result = await ctx.em.save(TransferIntentEntity, entity)

    return TransferIntentRepositoryMapper.toDomain(result)
  }

  async claimOne(ctx: TxContext): Promise<TransferIntentModel | null> {
    const entity = await ctx.em
      .createQueryBuilder(TransferIntentEntity, 'intent')
      .where('intent.status = :status', { status: TransferIntentEntityStatus.CREATED })
      .setLock('pessimistic_write')
      .setOnLocked('skip_locked')
      .limit(1)
      .getOne()

    if (!entity) {
      return null
    }

    const result = await ctx.em.update(
      TransferIntentEntity,
      { id: entity.id },
      { status: TransferIntentEntityStatus.ACCEPTED },
    )

    if (result.affected !== 1) {
      throw new Error(`cannot make claim! ${entity.id}`)
    }

    return TransferIntentRepositoryMapper.toDomain({ ...entity, status: TransferIntentEntityStatus.ACCEPTED })
  }

  async updateTransactionId(
    data: Pick<TransferIntentModel, 'id' | 'transactionIntentId'>,
    ctx?: TxContext,
  ): Promise<boolean> {
    const em = ctx?.em ?? this.datasource.manager
    const result = await em.update(
      TransferIntentEntity,
      { id: data.id },
      { transactionIntentId: data.transactionIntentId },
    )

    return result.affected === 1
  }

  async get(ids: ReadonlySet<Id>, ctx?: TxContext): Promise<ReadonlyArray<TransferIntentModel>> {
    const em = ctx?.em ?? this.datasource.manager

    const result = await em.find(TransferIntentEntity, {
      where: { id: In(Array.from(ids)) },
    })

    return result.map((intent) => TransferIntentRepositoryMapper.toDomain(intent))
  }

  async markAsPrepared(params: MarkAsPreparedParams, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.update(
      TransferIntentEntity,
      {
        status: TransferIntentEntityStatus.ACCEPTED,
        intentType: intentTypeFromDomain(params.intentType),
        intentId: In(Array.from(params.intentIds)),
      },
      { status: TransferIntentEntityStatus.PREPARED },
    )

    return result.affected === params.intentIds.size
  }

  async markAsProcessing(params: MarkAsProcessingParams, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.update(
      TransferIntentEntity,
      { transactionIntentId: params.transactionIntentId, status: TransferIntentEntityStatus.PREPARED },
      { status: TransferIntentEntityStatus.PROCESSING },
    )

    return (result.affected ?? 0) > 0
  }
}
