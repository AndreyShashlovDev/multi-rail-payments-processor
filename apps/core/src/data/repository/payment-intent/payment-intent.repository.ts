import { InjectDataSource } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
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
import { FindAvailableByParams } from './payment-intent-repository.types'
import { PaymentIntentRepositoryMapper } from './payment-intent-repository.mapper'
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere'
import { integrationTypeFromDomain } from '@app/shared'
import { TxContext } from '@app/shared/types/tx-context.type'
import { UUID } from '@app/types'

@Injectable()
export class PaymentIntentRepository {
  constructor(
    @InjectDataSource(CorePostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  async findByParams(params: FindAvailableByParams, ctx?: TxContext): Promise<PaymentIntentModel[]> {
    if (params.params.length === 0) return []

    const conditions: FindOptionsWhere<PaymentIntentEntity>[] = params.params.map((dataParam) => ({
      to: {
        integrationAccount: {
          account: dataParam.to,
        },
      },
      status: In(Array.from(params.status).map((status) => PaymentIntentRepositoryMapper.fromDomainStatus(status))),
      integration: integrationTypeFromDomain(params.integration),
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
        status: PaymentIntentStatus.CREATED,
      },
      this.datasource.manager,
    )

    const result = await ctx.em.save(PaymentIntentEntity, entity)

    return PaymentIntentRepositoryMapper.toDomain(result)
  }

  async markAsProcessing(params: Pick<PaymentIntentModel, 'id'>, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.update(
      PaymentIntentEntity,
      { id: params.id, status: PaymentIntentEntityStatus.CREATED },
      { status: PaymentIntentEntityStatus.PROCESSING },
    )

    return result.affected === 1
  }

  async findByIds(ids: ReadonlySet<UUID>, ctx?: TxContext): Promise<ReadonlyArray<PaymentIntentModel>> {
    const em = ctx?.em ?? this.datasource.manager

    const result = await em.find(PaymentIntentEntity, {
      where: { id: In(Array.from(ids)) },
    })

    return result.map((payment) => PaymentIntentRepositoryMapper.toDomain(payment))
  }

  async changeStatusBulk(
    data: ReadonlyArray<Pick<PaymentIntentModel, 'id' | 'status'>>,
    ctx: TxContext,
  ): Promise<void> {
    if (!data.length) return

    const params: (UUID | PaymentIntentEntityStatus)[] = []
    const values = data
      .map((item) => {
        params.push(item.id, PaymentIntentRepositoryMapper.fromDomainStatus(item.status))

        const idIdx = params.length - 1
        const statusIdx = params.length

        return `($${idIdx}::uuid, $${statusIdx}::smallint)`
      })
      .join(', ')

    await ctx.em.query(
      `UPDATE ${PaymentIntentEntity.PATH}
       SET status = v.status FROM (VALUES ${values}) AS v(id
         , status)
       WHERE ${PaymentIntentEntity.PATH}.id = v.id`,
      params,
    )
  }
}
