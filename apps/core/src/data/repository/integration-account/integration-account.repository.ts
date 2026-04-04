import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, In, IsNull } from 'typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import {
  HasAccountsData,
  HasAccountsResult,
  GetAccountsData,
  CreateAccountData,
} from './integration-account-repository.types'
import { integrationTypeFromDomain } from '@app/shared'
import {
  IntegrationAccountEntity,
  IntegrationAccountEntityStatus,
} from '../../data-source/postgres/entities/integration-account.entity'
import { IntegrationAccountRepositoryMapper } from './integration-account-repository.mapper'
import { IntegrationAccountModel } from '../../../shared/model/integration-account.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import { PaymentIntentData } from '../../../module/payment-intent/model/payment-intent.model'

@Injectable()
export class IntegrationAccountRepository {
  constructor(
    @InjectDataSource(CorePostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  // todo write code!
  async hasAccounts(data: HasAccountsData, _ctx?: TxContext): Promise<HasAccountsResult> {
    return { existing: data.addresses }
  }

  async get(data: GetAccountsData, ctx?: TxContext): Promise<ReadonlyArray<IntegrationAccountModel>> {
    const em = ctx?.em ?? this.datasource.manager

    const result = await em.find(IntegrationAccountEntity, {
      where: {
        integration: integrationTypeFromDomain(data.integration),
        account: In(Array.from(data.addresses)),
      },
    })

    return result.map((account) => IntegrationAccountRepositoryMapper.toDomain(account))
  }

  async create(data: CreateAccountData): Promise<void> {
    await this.datasource.manager.save(IntegrationAccountEntity, {
      ...data.account,
      integration: integrationTypeFromDomain(data.account.integration),
      status: IntegrationAccountEntityStatus.AVAILABLE,
    })
  }

  async makeUseAccount(
    data: Pick<PaymentIntentData, 'integration' | 'currency'>,
    ctx: TxContext,
  ): Promise<IntegrationAccountModel | null> {
    if (!ctx.em.queryRunner?.isTransactionActive) {
      throw new Error('IntegrationAccountRepository.makeUseAccount must be called within an active transaction')
    }

    const integration = integrationTypeFromDomain(data.integration)

    const entity = await ctx.em.findOne(IntegrationAccountEntity, {
      where: [
        {
          integration,
          currency: data.currency,
          status: IntegrationAccountEntityStatus.AVAILABLE,
        },
        {
          integration,
          currency: IsNull(),
          status: IntegrationAccountEntityStatus.AVAILABLE,
        },
      ],
      order: {
        currency: { direction: 'asc', nulls: 'last' },
      },
      lock: {
        mode: 'pessimistic_write',
        onLocked: 'skip_locked',
      },
    })

    if (!entity) return null

    await ctx.em.update(IntegrationAccountEntity, { id: entity.id }, { status: IntegrationAccountEntityStatus.IN_USE })

    return IntegrationAccountRepositoryMapper.toDomain({ ...entity, status: IntegrationAccountEntityStatus.IN_USE })
  }
}
