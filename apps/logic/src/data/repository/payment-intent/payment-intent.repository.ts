import { InjectDataSource } from '@nestjs/typeorm'
import { LogicPostgresConfig } from '../../data-source/postgres/logic-postgres.config'
import { DataSource, In } from 'typeorm'
import { Injectable } from '@nestjs/common'
import {
  PaymentIntentEntity,
  PaymentIntentEntityStatus,
} from '../../data-source/postgres/entities/payment-intent.entity'
import {
  PaymentIntentData,
  PaymentIntentModel,
  PaymentIntentStatus,
} from '../../../module/payment-intent/model/payment-intent.model'
import { FindActiveByParams } from './payment-intent-repository.types'
import { PaymentIntentRepositoryMapper } from './payment-intent-repository.mapper'
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere'
import { integrationTypeFromDomain } from '@app/shared'
import { TxContext } from '@app/shared/types/tx-context.type'
import { Numeric, UUID } from '@app/types'

@Injectable()
export class PaymentIntentRepository {
  constructor(
    @InjectDataSource(LogicPostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  async findActiveByParams(data: FindActiveByParams, ctx?: TxContext): Promise<PaymentIntentModel[]> {
    if (data.params.length === 0) return []

    const conditions: FindOptionsWhere<PaymentIntentEntity>[] = data.params.map((dataParam) => ({
      to: {
        integrationAccount: {
          account: dataParam.to,
        },
      },
      status: PaymentIntentRepositoryMapper.fromDomainStatus(data.status),
      integration: integrationTypeFromDomain(data.integration),
      currency: dataParam.currency,
    }))

    const em = ctx?.em ?? this.datasource.manager
    const result = await em.find(PaymentIntentEntity, { where: conditions })

    return result.map((item) => PaymentIntentRepositoryMapper.toDomain(item))
  }

  async create(data: Omit<PaymentIntentData, 'status' | 'paid'>, ctx: TxContext): Promise<PaymentIntentModel> {
    const entity = PaymentIntentRepositoryMapper.fromDomain(
      {
        ...data,
        paid: Numeric.ZERO,
        status: PaymentIntentStatus.CREATED,
      },
      this.datasource.manager,
    )

    const result = await ctx.em.save(PaymentIntentEntity, entity)

    return PaymentIntentRepositoryMapper.toDomain(result)
  }

  async markAsConfirmingBulk(ids: ReadonlySet<UUID>, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.update(
      PaymentIntentEntity,
      { id: In(Array.from(ids)), status: PaymentIntentEntityStatus.CREATED },
      { status: PaymentIntentEntityStatus.CONFIRMING },
    )

    return result.affected === ids.size
  }

  async markAsUnderpay(data: Pick<PaymentIntentModel, 'id'>, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.update(
      PaymentIntentEntity,
      { id: data.id, status: PaymentIntentEntityStatus.CONFIRMING },
      { status: PaymentIntentEntityStatus.UNDERPAY },
    )

    return result.affected === 1
  }

  async markAsOverpay(data: Pick<PaymentIntentModel, 'id'>, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.update(
      PaymentIntentEntity,
      { id: data.id, status: PaymentIntentEntityStatus.CONFIRMING },
      { status: PaymentIntentEntityStatus.OVERPAY },
    )

    return result.affected === 1
  }

  async markAsCompleted(data: Pick<PaymentIntentModel, 'id'>, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.update(
      PaymentIntentEntity,
      { id: data.id, status: PaymentIntentEntityStatus.CONFIRMING },
      { status: PaymentIntentEntityStatus.COMPLETED },
    )

    return result.affected === 1
  }
}
