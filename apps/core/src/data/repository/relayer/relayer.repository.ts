import { IntegrationAccount, Numeric } from '@app/types'
import { GetRelayerAccountParams } from './relayer-repository.types'
import { InjectDataSource } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { DataSource } from 'typeorm'
import { IntegrationAccountLinkEntity } from '../../data-source/postgres/entities/integration-account-link.entity'
import { AccountEntity, AccountEntityRole } from '../../data-source/postgres/entities/account.entity'
import { IntegrationAccountBalanceEntity } from '../../data-source/postgres/entities/integration-account-balance.entity'
import { integrationTypeFromDomain } from '@app/shared'
import { Injectable } from '@nestjs/common'

@Injectable()
export class RelayerRepository {
  constructor(
    @InjectDataSource(CorePostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  async findAvailable(params: GetRelayerAccountParams): Promise<IntegrationAccount | null> {
    const result = await this.datasource.manager
      .createQueryBuilder(IntegrationAccountLinkEntity, 'link')
      .innerJoinAndSelect('link.integrationAccount', 'lia')
      .innerJoin(AccountEntity, 'account', 'account.id = link.platform_account_id AND account.role = :role', {
        role: AccountEntityRole.PLATFORM,
      })
      .innerJoin(
        IntegrationAccountBalanceEntity,
        'balance',
        'balance.account = lia.account AND balance.integration = :integration AND balance.currency = :currency AND balance.available >= :amount',
        {
          integration: integrationTypeFromDomain(params.integration),
          currency: params.currency,
          amount: params.amount.toFixed(Numeric.EXPONENT),
        },
      )
      .where('lia.integration = :integration', {
        integration: integrationTypeFromDomain(params.integration),
      })
      .orderBy('balance.available', 'DESC')
      .getOne()

    return result ? result.integrationAccount!.account : null
  }
}
