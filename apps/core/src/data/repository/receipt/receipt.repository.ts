import { TxContext } from '@app/shared/types/tx-context.type'
import { InjectDataSource } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { DataSource } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { ReceiptRepositoryMapper } from './receipt-repository.mapper'
import { UUID, Numeric } from '@app/types'
import { ReceiptEntity } from '../../data-source/postgres/entities/receipt.entity'
import { SumAmountsParams, ReceiptData, ReceiptModel } from './receipt-repository.types'
import { intentTypeFromDomain } from '@app/shared'

@Injectable()
export class ReceiptRepository {
  constructor(
    @InjectDataSource(CorePostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  async create(data: ReceiptData, ctx: TxContext): Promise<ReceiptModel> {
    const entity = ReceiptRepositoryMapper.fromDomain(data, ctx.em)
    const result = await ctx.em.save(entity)

    return ReceiptRepositoryMapper.toDomain(result)
  }

  async sumAmountByIntentIds(params: SumAmountsParams, ctx?: TxContext): Promise<Map<UUID, Numeric>> {
    if (params.intentIds.size === 0) {
      return new Map<UUID, Numeric>()
    }

    const em = ctx?.em ?? this.datasource.manager

    const result = await em
      .createQueryBuilder(ReceiptEntity, 'rec')
      .select('rec.intent_id', 'intentId')
      .addSelect('SUM(rec.amount)', 'total')
      .where('rec.intent_id IN (:...intentIds)', { intentIds: Array.from(params.intentIds) })
      .andWhere('rec.intent_type = :intentType', { intentType: intentTypeFromDomain(params.intentType) })
      .groupBy('rec.intent_id')
      .getRawMany<{ intentId: UUID; total: string }>()

    return new Map(result.map((row) => [row.intentId, Numeric.create(row.total)]))
  }
}
