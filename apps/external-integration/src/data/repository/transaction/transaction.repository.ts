import { TransactionModel, TransactionData } from '../../../module/transaction/model/transaction.model'
import { Injectable } from '@nestjs/common'
import { DataSource, EntityManager } from 'typeorm'
import { TransactionRepositoryMapper } from './transaction-repository.mapper'
import { InjectDataSource } from '@nestjs/typeorm'
import { IntegrationPostgresConfig } from '../../data-source/postgres/integration-postgres.config'
import { TransactionEntity, TransactionEntityStatus } from '../../data-source/postgres/entities/transaction.entity'
import { TransactionRawEntity } from '../../data-source/postgres/entities/transaction-raw.entity'
import { TxContext } from '@app/shared/types/tx-context.type'
import { integrationTypeFromDomain } from '@app/shared'
import { TransferEntity } from '../../data-source/postgres/entities/transfer.entity'

@Injectable()
export class TransactionRepository {
  constructor(
    @InjectDataSource(IntegrationPostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  async save(transaction: TransactionData, ctx?: TxContext): Promise<TransactionModel> {
    const em = ctx?.em ?? this.datasource.manager

    const intoTxCall = async (em: EntityManager) => {
      const { transfers: rawTransfers, ...entity } = TransactionRepositoryMapper.fromDomain(transaction, em)

      const existing = await em
        .createQueryBuilder(TransactionEntity, 'tx')
        .where('tx.sourceTxId = :sourceTxId AND tx.integration = :integration', {
          sourceTxId: transaction.sourceTxId,
          integration: integrationTypeFromDomain(transaction.integration),
        })
        .setLock('pessimistic_write')
        .getOne()

      if (!existing) {
        const saved = await em.save(TransactionEntity, entity)

        let savedTransfers: TransferEntity[] = []
        if (rawTransfers?.length) {
          savedTransfers = await em.save(
            TransferEntity,
            rawTransfers.map((transfer) => ({ ...transfer, transaction: saved })),
          )
        }

        let rawEntity: TransactionRawEntity | null = null
        if (transaction.raw) {
          rawEntity = TransactionRepositoryMapper.createRawTransaction(saved, transaction.raw, em)
          await em.save(TransactionRawEntity, rawEntity)
        }

        return TransactionRepositoryMapper.toDomainRaw({ ...saved, transfers: savedTransfers }, rawEntity)
      }

      await em
        .createQueryBuilder()
        .insert()
        .into(TransactionRawEntity)
        .values({
          transactionId: existing.id,
          integration: integrationTypeFromDomain(transaction.integration),
          data: JSON.stringify(transaction.raw),
        })
        .orUpdate(['data'], ['transaction_id'])
        .execute()

      await em.update(
        TransactionEntity,
        { id: existing.id },
        {
          status: entity.status,
          blockId: entity.blockId,
          blockTime: entity.blockTime,
          metadata: entity.metadata,
          fee: entity.fee,
          feeCurrency: entity.feeCurrency,
        },
      )

      const result = await em.findOne(TransactionEntity, {
        where: { id: existing.id },
        relations: ['transfers'],
      })

      return TransactionRepositoryMapper.toDomainRaw(result!)
    }

    if (em.queryRunner?.isTransactionActive) {
      return await intoTxCall(em)
    } else {
      return await this.datasource.manager.transaction(async (em) => await intoTxCall(em))
    }
  }

  async markAsConfirmed(
    params: Pick<TransactionModel, 'sourceTxId' | 'integration'>,
    ctx: TxContext,
  ): Promise<boolean> {
    const result = await ctx.em.update(
      TransactionEntity,
      {
        sourceTxId: params.sourceTxId,
        integration: integrationTypeFromDomain(params.integration),
        status: TransactionEntityStatus.ACCEPTED,
      },
      { status: TransactionEntityStatus.CONFIRMED },
    )

    return result.affected === 1
  }

  async markAsPromoted(params: Pick<TransactionData, 'sourceTxId' | 'integration'>, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.update(
      TransactionEntity,
      {
        sourceTxId: params.sourceTxId,
        integration: integrationTypeFromDomain(params.integration),
        status: TransactionEntityStatus.PREPARED,
      },
      { status: TransactionEntityStatus.PROMOTED },
    )

    return result.affected === 1
  }

  async get(
    params: Pick<TransactionData, 'sourceTxId' | 'integration'>,
    ctx?: TxContext,
  ): Promise<TransactionModel | null> {
    const em = ctx?.em ?? this.datasource.manager
    const result = await em.findOne(TransactionEntity, {
      where: {
        sourceTxId: params.sourceTxId,
        integration: integrationTypeFromDomain(params.integration),
      },
      relations: ['transfers'],
    })

    return result ? TransactionRepositoryMapper.toDomainRaw(result) : null
  }

  async getConfirmed(
    params: Pick<TransactionModel, 'sourceTxId' | 'integration'>,
    ctx: TxContext,
  ): Promise<TransactionModel | null> {
    const result = await ctx.em.findOne(TransactionEntity, {
      where: {
        sourceTxId: params.sourceTxId,
        integration: integrationTypeFromDomain(params.integration),
        status: TransactionEntityStatus.CONFIRMED,
      },
      relations: ['transfers'],
    })

    return result ? TransactionRepositoryMapper.toDomainRaw(result) : null
  }
}
