import { Injectable } from '@nestjs/common'
import {
  PaymentAmountAccumulatorData,
  PaymentAmountAccumulatorModel,
} from '../../../module/payment-intent/model/payment-amount-accumulator.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import { PaymentAmountAccumulatorRepositoryMapper } from './payment-amount-accumulator-repository.mapper'
import { PaymentAmountAccumulatorEntity } from '../../data-source/postgres/entities/payment-amount-accumulator.entity'
import { InjectDataSource } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { DataSource, In } from 'typeorm'
import { UUID, Numeric } from '@app/types'

@Injectable()
export class PaymentAmountAccumulatorRepository {
  constructor(
    @InjectDataSource(CorePostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  async create(data: PaymentAmountAccumulatorData, ctx: TxContext): Promise<PaymentAmountAccumulatorModel> {
    const entity = PaymentAmountAccumulatorRepositoryMapper.fromDomain(data, ctx.em)
    const result = await ctx.em.save(PaymentAmountAccumulatorEntity, entity)

    return PaymentAmountAccumulatorRepositoryMapper.toDomain(result)
  }

  async findByPaymentIds(
    paymentIds: ReadonlySet<UUID>,
    ctx?: TxContext,
  ): Promise<ReadonlyArray<PaymentAmountAccumulatorModel>> {
    const em = ctx?.em ?? this.datasource.manager

    const result = await em.find(PaymentAmountAccumulatorEntity, {
      where: {
        paymentId: In(Array.from(paymentIds)),
      },
    })

    return result.map((item) => PaymentAmountAccumulatorRepositoryMapper.toDomain(item))
  }

  async sumAmountByPaymentIds(paymentIds: ReadonlySet<UUID>, ctx?: TxContext): Promise<Map<UUID, Numeric>> {
    if (paymentIds.size === 0) {
      return new Map<UUID, Numeric>()
    }

    const em = ctx?.em ?? this.datasource.manager

    const result = await em
      .createQueryBuilder(PaymentAmountAccumulatorEntity, 'acc')
      .select('acc.payment_id', 'paymentId')
      .addSelect('SUM(acc.amount)', 'total')
      .where('acc.payment_id IN (:...paymentIds)', { paymentIds: Array.from(paymentIds) })
      .groupBy('acc.paymentId')
      .getRawMany<{ paymentId: UUID; total: string }>()

    return new Map(result.map((row) => [row.paymentId, Numeric.create(row.total)]))
  }

  async deleteByPaymentIds(paymentIds: ReadonlySet<UUID>, ctx: TxContext): Promise<void> {
    if (!paymentIds.size) return

    await ctx.em.delete(PaymentAmountAccumulatorEntity, { paymentId: In(Array.from(paymentIds)) })
  }
}
