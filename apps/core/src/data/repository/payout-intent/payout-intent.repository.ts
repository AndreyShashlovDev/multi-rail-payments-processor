import { InjectDataSource } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { DataSource, In } from 'typeorm'
import { Injectable } from '@nestjs/common'
import {
  PayoutIntentModel,
  PayoutIntentData,
  PayoutIntentStatus,
} from '../../../module/payout-intent/model/payout-intent.model'
import { PayoutIntentEntity, PayoutIntentEntityStatus } from '../../data-source/postgres/entities/payout-intent.entity'
import { PayoutIntentRepositoryMapper } from './payout-intent-repository.mapper'
import { UUID } from '@app/types'
import { TxContext } from '@app/shared/types/tx-context.type'
import { MarkPreparedData, MarkConfirmingData } from './payout-intent-repository.types'

@Injectable()
export class PayoutIntentRepository {
  constructor(
    @InjectDataSource(CorePostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  async getByIds(data: Set<UUID>, ctx?: TxContext): Promise<PayoutIntentModel[]> {
    const em = ctx?.em ?? this.datasource.manager

    const payouts = await em.find(PayoutIntentEntity, { where: { id: In(Array.from(data)) } })

    return payouts.map((payout) => PayoutIntentRepositoryMapper.toDomain(payout))
  }

  async create(data: Omit<PayoutIntentData, 'status' | 'metadata'>): Promise<PayoutIntentModel> {
    const entity = PayoutIntentRepositoryMapper.fromDomain(
      { ...data, status: PayoutIntentStatus.CREATED, metadata: null },
      this.datasource.manager,
    )
    const result = await this.datasource.manager.save(PayoutIntentEntity, entity)

    return PayoutIntentRepositoryMapper.toDomain(result)
  }

  async makePrepared(data: MarkPreparedData, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.update(
      PayoutIntentEntity,
      { id: data.id, status: PayoutIntentEntityStatus.CREATED },
      {
        integrationFeePayerIntegrationAccount: data.integrationFeePayer.account,
        integrationFeePayerPlatformAccount: data.integrationFeePayer.platformAccountId,
        integrationFeePayerId: data.integrationFeePayer.accountLinkId,
        integrationFee: data.integrationFee,
        status: PayoutIntentEntityStatus.PREPARED,
      },
    )

    return result.affected === 1
  }

  async markProcessing(ids: ReadonlySet<UUID>): Promise<boolean> {
    const result = await this.datasource.manager.update(
      PayoutIntentEntity,
      { id: In(Array.from(ids)), status: PayoutIntentEntityStatus.HELD },
      { status: PayoutIntentEntityStatus.PROCESSING },
    )

    return result.affected === ids.size
  }

  async makeConfirming(data: MarkConfirmingData, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.update(
      PayoutIntentEntity,
      { id: data.id, status: PayoutIntentEntityStatus.PROCESSING },
      {
        integrationFeePayerIntegrationAccount: data.integrationFeePayer.account,
        integrationFeePayerPlatformAccount: data.integrationFeePayer.platformAccountId,
        integrationFeePayerId: data.integrationFeePayer.accountLinkId,
        integrationFee: data.integrationFee,
        status: PayoutIntentEntityStatus.CONFIRMING,
      },
    )

    return result.affected === 1
  }

  async markSuccess(params: Pick<PayoutIntentModel, 'id'>, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.update(
      PayoutIntentEntity,
      { id: params.id, status: PayoutIntentEntityStatus.CONFIRMING },
      { status: PayoutIntentEntityStatus.SUCCESS },
    )

    return result.affected === 1
  }

  async markAsHeld(param: Pick<PayoutIntentModel, 'id'>, ctx: TxContext): Promise<boolean> {
    const result = await ctx.em.update(
      PayoutIntentEntity,
      { id: param.id, status: PayoutIntentEntityStatus.PREPARED },
      { status: PayoutIntentEntityStatus.HELD },
    )

    return result.affected === 1
  }
}
