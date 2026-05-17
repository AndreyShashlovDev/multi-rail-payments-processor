import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, In, IsNull, Not } from 'typeorm'
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
import { isUUID } from 'class-validator'
import { IntegrationAccount } from '@app/types'
import { AccountEntity } from '../../data-source/postgres/entities/account.entity'

@Injectable()
export class IntegrationAccountRepository {
  constructor(
    @InjectDataSource(CorePostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  // todo cache it
  async hasAccounts(data: HasAccountsData, _ctx?: TxContext): Promise<HasAccountsResult> {
    if (data.accounts.size === 0) {
      return { existing: new Set() }
    }

    const accounts = Array.from(data.accounts)
    const uuidAccounts = accounts.filter((a) => isUUID(a))
    const existing = new Set<IntegrationAccount>()

    if (uuidAccounts.length > 0) {
      const results = await this.datasource.manager.query<{ account: string }[]>(
        `
        SELECT account FROM ${IntegrationAccountEntity.PATH}
        WHERE account = ANY($1)
        AND status NOT IN (${IntegrationAccountEntityStatus.FROZEN}, ${IntegrationAccountEntityStatus.RETIRED})
        UNION
        SELECT id::text FROM ${AccountEntity.PATH}
        WHERE id = ANY($2::uuid[])
      `,
        [accounts, uuidAccounts],
      )

      results.forEach((acc) => existing.add(acc.account as IntegrationAccount))
    } else {
      const integrationResults = await this.datasource.manager.find(IntegrationAccountEntity, {
        select: ['account'],
        where: {
          account: In(accounts),
          status: Not(In([IntegrationAccountEntityStatus.FROZEN, IntegrationAccountEntityStatus.RETIRED])),
        },
      })
      integrationResults.forEach((acc) => existing.add(acc.account))
    }

    return { existing }
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
