import { Injectable } from '@nestjs/common'
import { TransferIntentData, TransferIntentModel } from '../../model/transfer-intent.model'
import { TransferIntentRepositoryMapper } from './transfer-intent-repository.mapper'
import { InjectDataSource } from '@nestjs/typeorm'
import { IntegrationPostgresConfig } from '../../../../data/data-source/postgres/integration-postgres.config'
import { DataSource, In } from 'typeorm'
import {
  TransferIntentEntity,
  TransferIntentEntityStatus,
} from '../../../../data/data-source/postgres/entities/transfer-intent.entity'
import { TxContext } from '@app/shared/types/tx-context.type'
import { Id } from '@app/types'

@Injectable()
export class TransferIntentRepository {
  constructor(
    @InjectDataSource(IntegrationPostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  async create(data: TransferIntentData, ctx: TxContext): Promise<TransferIntentModel> {
    const entity = TransferIntentRepositoryMapper.fromDomain(data, this.datasource.manager)

    const result = await ctx.em.save(TransferIntentEntity, {
      ...entity,
      status: TransferIntentEntityStatus.CREATED,
    })

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
      { status: TransferIntentEntityStatus.PROCESSING },
    )

    if (result.affected !== 1) {
      throw new Error(`cannot make claim! ${entity.id}`)
    }

    return TransferIntentRepositoryMapper.toDomain({ ...entity, status: TransferIntentEntityStatus.PROCESSING })
  }

  async changeDepositId(params: Pick<TransferIntentModel, 'id' | 'depositId'>, ctx?: TxContext): Promise<boolean> {
    const em = ctx?.em ?? this.datasource.manager
    const result = await em.update(TransferIntentEntity, { id: params.id }, { depositId: params.depositId })

    return result.affected === 1
  }

  async get(ids: ReadonlySet<Id>, ctx?: TxContext): Promise<ReadonlyArray<TransferIntentModel>> {
    const em = ctx?.em ?? this.datasource.manager

    const result = await em.find(TransferIntentEntity, {
      where: { id: In(Array.from(ids)) },
    })

    return result.map((intent) => TransferIntentRepositoryMapper.toDomain(intent))
  }

  async markAsCompleted(params: Pick<TransferIntentModel, 'id'>, ctx: TxContext): Promise<boolean> {
    const em = ctx.em

    const result = await em.update(
      TransferIntentEntity,
      { id: params.id, status: TransferIntentEntityStatus.PROCESSING },
      { status: TransferIntentEntityStatus.COMPLETED },
    )

    return result.affected === 1
  }

  async markAsFailed(params: Pick<TransferIntentModel, 'id'>, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.update(
      TransferIntentEntity,
      { id: params.id, status: TransferIntentEntityStatus.PROCESSING },
      { status: TransferIntentEntityStatus.FAILED },
    )

    return result.affected === 1
  }

  // serializes the handling of one intent's step events across orchestrator instances
  async lock(id: Id, ctx: TxContext): Promise<TransferIntentModel | null> {
    const entity = await ctx.em
      .createQueryBuilder(TransferIntentEntity, 'intent')
      .where('intent.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne()

    return entity ? TransferIntentRepositoryMapper.toDomain(entity) : null
  }
}
