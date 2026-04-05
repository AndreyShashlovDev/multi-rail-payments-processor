import { PaymentReceiptData, PaymentReceiptModel } from '../../../module/payment-intent/model/payment-receipt.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import { InjectDataSource } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { DataSource } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { PaymentReceiptRepositoryMapper } from './payment-receipt-repository.mapper'

@Injectable()
export class PaymentReceiptRepository {
  constructor(
    @InjectDataSource(CorePostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  async create(data: PaymentReceiptData, ctx: TxContext): Promise<PaymentReceiptModel> {
    const entity = PaymentReceiptRepositoryMapper.fromDomain(data, ctx.em)
    const result = await ctx.em.save(entity)

    return PaymentReceiptRepositoryMapper.toDomain(result)
  }
}
