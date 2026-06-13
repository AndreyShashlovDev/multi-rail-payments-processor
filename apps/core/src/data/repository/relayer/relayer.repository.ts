import { IntegrationAccount, Numeric } from '@app/types'
import { GetRelayerAccountParams, GetRelayerAccountResult } from './relayer-repository.types'
import { InjectDataSource } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { DataSource } from 'typeorm'
import {
  IntegrationAccountLinkEntity,
  LinkEntityType,
  LinkEntityStatus,
} from '../../data-source/postgres/entities/integration-account-link.entity'
import { AccountEntity, AccountEntityRole } from '../../data-source/postgres/entities/account.entity'
import { IntegrationAccountBalanceEntity } from '../../data-source/postgres/entities/integration-account-balance.entity'
import { integrationTypeFromDomain } from '@app/shared'
import { Injectable } from '@nestjs/common'
import {
  IntegrationAccountEntity,
  IntegrationAccountEntityStatus,
} from '../../data-source/postgres/entities/integration-account.entity'

@Injectable()
export class RelayerRepository {
  constructor(
    @InjectDataSource(CorePostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  async findSystemAvailable(params: GetRelayerAccountParams): Promise<IntegrationAccount | null> {
    const result = await this.datasource.manager
      .createQueryBuilder(IntegrationAccountEntity, 'lia')
      .innerJoin(
        IntegrationAccountBalanceEntity,
        'balance',
        'balance.account = lia.account AND balance.integration = :integration AND balance.currency = :currency AND balance.available >= :amount',
        {
          integration: integrationTypeFromDomain(params.integration),
          currency: params.currency,
          amount: params.amount.toFixed(Numeric.DECIMALS),
        },
      )
      // нет активного REGULAR link (кошелёк не принадлежит никому постоянно)
      .andWhere((qb) => {
        const sub = qb
          .subQuery()
          .select('1')
          .from(IntegrationAccountLinkEntity, 'link')
          .where('link.integrationAccountId = lia.id')
          .andWhere('link.linkType = :regular', { regular: LinkEntityType.REGULAR })
          .andWhere('link.status = :active', { active: LinkEntityStatus.ACTIVE })
          .getQuery()
        return `NOT EXISTS ${sub}`
      })
      .where('lia.integration = :integration', {
        integration: integrationTypeFromDomain(params.integration),
      })
      .andWhere('lia.status != :frozen', { frozen: IntegrationAccountEntityStatus.FROZEN })
      .andWhere('lia.status != :retired', { retired: IntegrationAccountEntityStatus.RETIRED })
      .orderBy('balance.available', 'DESC')
      .getOne()

    return result ? result.account : null
  }

  async findPlatformAvailable(params: GetRelayerAccountParams): Promise<GetRelayerAccountResult | null> {
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
          amount: params.amount.toFixed(Numeric.DECIMALS),
        },
      )
      .where('link.linkType = :regular', { regular: LinkEntityType.REGULAR })
      .andWhere('link.status = :active', { active: LinkEntityStatus.ACTIVE })
      .andWhere('lia.integration = :integration', {
        integration: integrationTypeFromDomain(params.integration),
      })
      .orderBy('balance.available', 'DESC')
      .getOne()

    return result
      ? {
          platformAccountId: result.platformAccountId,
          account: result.integrationAccount!.account,
        }
      : null
  }
}
