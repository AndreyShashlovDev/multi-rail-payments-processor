import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { IntegrationPostgresConfig } from '../../data-source/postgres/integration-postgres.config'
import { DataSource } from 'typeorm'
import {
  TransactionIntentData,
  TransactionIntentModel,
} from '../../../module/transaction/model/transaction-intent.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import { TransactionIntentRepositoryMapper } from './transaction-intent-repository.mapper'
import {
  TransactionIntentEntity,
  TransactionIntentEntityStatus,
} from '../../data-source/postgres/entities/transaction-intent.entity'
import { integrationTypeFromDomain } from '@app/shared'
import { Id } from '@app/types'
import {
  TransferRouteEntity,
  TransferRouteEntityStatus,
} from '../../data-source/postgres/entities/transfer-route.entity'

@Injectable()
export class TransactionIntentRepository {
  constructor(@InjectDataSource(IntegrationPostgresConfig.DATASOURCE_NAME) private readonly datasource: DataSource) {}

  async create(data: TransactionIntentData, ctx: TxContext): Promise<TransactionIntentModel> {
    const entity = TransactionIntentRepositoryMapper.fromDomain(data, ctx.em)

    const result = await ctx.em.save(TransactionIntentEntity, {
      ...entity,
      status: TransactionIntentEntityStatus.HOLD_PENDING,
      signedData: null,
    })

    return TransactionIntentRepositoryMapper.toDomain(result)
  }

  async findReadyForSign(
    params: { take: number; skip: number },
    ctx: TxContext,
  ): Promise<ReadonlyArray<TransactionIntentModel>> {
    const result = await ctx.em
      .createQueryBuilder(TransactionIntentEntity, 'ti')
      .setLock('pessimistic_write', undefined, ['ti'])
      .setOnLocked('skip_locked')
      .where('ti.status = :status', { status: TransactionIntentEntityStatus.HOLD_PENDING })
      .andWhere('ti.signedData IS NULL')
      // нет незавершённых предшественников
      .andWhere((qb) => {
        const sub = qb
          .subQuery()
          .select('1')
          .from(TransferRouteEntity, 'predecessor')
          .innerJoin(
            TransferRouteEntity,
            'current',
            'current.transactionIntentId = ti.id AND current.transferIntentId = predecessor.transferIntentId',
          )
          .where('predecessor.txIndex < current.txIndex')
          .andWhere('predecessor.status != :completed', {
            completed: TransferRouteEntityStatus.COMPLETED,
          })
          .getQuery()
        return `NOT EXISTS ${sub}`
      })
      // нет другой транзакции от того же initiator уже в работе
      .andWhere((qb) => {
        const sub = qb
          .subQuery()
          .select('1')
          .from(TransactionIntentEntity, 'other')
          .where('other.initiator = ti.initiator')
          .andWhere('other.integration = ti.integration')
          .andWhere('other.id != ti.id')
          .andWhere('other.status = :inProgress', {
            inProgress: TransactionIntentEntityStatus.SIGNING,
          })
          .getQuery()
        return `NOT EXISTS ${sub}`
      })
      .orderBy('ti.createdAt', 'ASC')
      .take(params.take)
      .skip(params.skip)
      .getMany()

    return result.map((ti) => TransactionIntentRepositoryMapper.toDomain(ti))
  }

  async markReadyForSigning(params: Pick<TransactionIntentModel, 'id'>, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.update(
      TransactionIntentEntity,
      { status: TransactionIntentEntityStatus.HOLD_PENDING, id: params.id },
      { status: TransactionIntentEntityStatus.READY_FOR_SIGNING },
    )

    return result.affected === 1
  }

  async markSigning(params: Pick<TransactionIntentModel, 'id'>, ctx?: TxContext): Promise<boolean> {
    const result = await (ctx?.em ?? this.datasource.manager).update(
      TransactionIntentEntity,
      {
        status: TransactionIntentEntityStatus.READY_FOR_SIGNING,
        id: params.id,
      },
      { status: TransactionIntentEntityStatus.SIGNING },
    )

    return result.affected === 1
  }

  async makeReadyToPromote(
    params: Pick<TransactionIntentModel, 'id' | 'signedData'>,
    ctx: TxContext,
  ): Promise<boolean> {
    const result = await ctx.em.update(
      TransactionIntentEntity,
      { status: TransactionIntentEntityStatus.SIGNING, id: params.id },
      { signedData: params.signedData, status: TransactionIntentEntityStatus.READY_TO_PROMOTE },
    )

    return result.affected === 1
  }

  async markCompleted(
    params: Pick<TransactionIntentModel, 'sourceTxId' | 'integration'>,
    ctx: TxContext,
  ): Promise<boolean> {
    const result = await ctx.em.update(
      TransactionIntentEntity,
      {
        status: TransactionIntentEntityStatus.PROMOTED,
        integration: integrationTypeFromDomain(params.integration),
        sourceTxId: params.sourceTxId,
      },
      { status: TransactionIntentEntityStatus.COMPLETED },
    )

    return result.affected === 1
  }

  async markPromoted(
    params: Pick<TransactionIntentModel, 'sourceTxId' | 'integration'>,
    ctx?: TxContext,
  ): Promise<Id | null> {
    const em = ctx?.em ?? this.datasource.manager

    const result: { raw: { id: Id }[] } = await em
      .createQueryBuilder()
      .update(TransactionIntentEntity)
      .set({ status: TransactionIntentEntityStatus.PROMOTED })
      .where({
        sourceTxId: params.sourceTxId,
        integration: integrationTypeFromDomain(params.integration),
        status: TransactionIntentEntityStatus.READY_TO_PROMOTE,
      })
      .returning('id')
      .execute()

    return result.raw[0]?.id ?? null
  }
}
