import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { IntegrationPostgresConfig } from '../../data-source/postgres/integration-postgres.config'
import { DataSource } from 'typeorm'
import {
  TransactionIntentData,
  TransactionIntentModel,
} from '../../../module/transaction-intent/model/transaction-intent.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import { TransactionIntentRepositoryMapper } from './transaction-intent-repository.mapper'
import {
  TransactionIntentEntity,
  TransactionIntentEntityStatus,
} from '../../data-source/postgres/entities/transaction-intent.entity'
import {
  TransferIntentEntityStatus,
  TransferIntentEntity,
} from '../../data-source/postgres/entities/transfer-intent.entity'
import { integrationTypeFromDomain } from '@app/shared'
import { Id } from '@app/types'

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

    return TransactionIntentRepositoryMapper.toDomain(result, data.transfers)
  }

  async findReadyForSign(
    params: { take: number; skip: number },
    ctx: TxContext,
  ): Promise<ReadonlyArray<TransactionIntentModel>> {
    const result = await ctx.em
      .createQueryBuilder(TransactionIntentEntity, 'transaction')
      .leftJoinAndSelect('transaction.transfers', 'transfer')
      .setLock('pessimistic_write', undefined, ['transaction'])
      .where('transaction.status = :status', { status: TransactionIntentEntityStatus.HOLD_PENDING })
      .andWhere('transaction.signedData IS NULL')
      .andWhere((qb) => {
        const sub = qb
          .subQuery()
          .select('1')
          .from(TransferIntentEntity, 'transfer')
          .where('transfer.transaction_intent_id = transaction.id')
          .andWhere('transfer.status != :preparedStatus', { preparedStatus: TransferIntentEntityStatus.PREPARED })
          .getQuery()
        return `NOT EXISTS ${sub}`
      })
      .andWhere((qb) => {
        const sub = qb
          .subQuery()
          .select('1')
          .from(TransferIntentEntity, 'transfer')
          .where('transfer.transaction_intent_id = transaction.id')
          .getQuery()
        return `EXISTS ${sub}`
      })
      .orderBy('transaction.createdAt', 'ASC')
      .take(params.take)
      .skip(params.skip)
      .setOnLocked('skip_locked')
      .getMany()

    return result.map((intent) => TransactionIntentRepositoryMapper.toDomainRaw(intent, intent.transfers))
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

  async markCompleted(params: Pick<TransactionIntentModel, 'txId' | 'integration'>, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.update(
      TransactionIntentEntity,
      {
        status: TransactionIntentEntityStatus.PROMOTED,
        integration: integrationTypeFromDomain(params.integration),
        txId: params.txId,
      },
      { status: TransactionIntentEntityStatus.COMPLETED },
    )

    return result.affected === 1
  }

  async markPromoted(
    params: Pick<TransactionIntentModel, 'txId' | 'integration'>,
    ctx?: TxContext,
  ): Promise<Id | null> {
    const em = ctx?.em ?? this.datasource.manager

    const result: { raw: { id: Id }[] } = await em
      .createQueryBuilder()
      .update(TransactionIntentEntity)
      .set({ status: TransactionIntentEntityStatus.PROMOTED })
      .where({
        txId: params.txId,
        integration: integrationTypeFromDomain(params.integration),
        status: TransactionIntentEntityStatus.READY_TO_PROMOTE,
      })
      .returning('id')
      .execute()

    return result.raw[0]?.id ?? null
  }
}
