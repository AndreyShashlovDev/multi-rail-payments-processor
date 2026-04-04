import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, In } from 'typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { GetActiveLinkParams, GetPlatformAccountParams } from './integration-account-link-repository.types'
import {
  IntegrationAccountLinkModel,
  IntegrationAccountLinkData,
  LinkModelStatus,
  LinkModelType,
} from '../../../shared/model/integration-account-link.model'
import {
  IntegrationAccountLinkEntity,
  LinkEntityStatus,
} from '../../data-source/postgres/entities/integration-account-link.entity'
import { IntegrationAccountLinkRepositoryMapper } from './integration-account-link-repository.mapper'
import { integrationTypeFromDomain } from '@app/shared'
import { TxContext } from '@app/shared/types/tx-context.type'
import { IntegrationAccountRepositoryMapper } from '../integration-account/integration-account-repository.mapper'
import { AccountEntity, AccountEntityRole } from '../../data-source/postgres/entities/account.entity'

@Injectable()
export class IntegrationAccountLinkRepository {
  constructor(@InjectDataSource(CorePostgresConfig.DATASOURCE_NAME) private readonly datasource: DataSource) {}

  async getPlatformFeeAccount(params: GetPlatformAccountParams): Promise<IntegrationAccountLinkModel | null> {
    return this.getPlatformHotAccount(params)
  }

  async getPlatformHotAccount(params: GetPlatformAccountParams): Promise<IntegrationAccountLinkModel | null> {
    const result = await this.datasource.manager
      .createQueryBuilder(IntegrationAccountLinkEntity, 'link')
      .innerJoinAndSelect('link.integrationAccount', 'integrationAccount')
      .innerJoin(AccountEntity, 'account', 'account.id = link.platformAccountId AND account.role = :role', {
        role: AccountEntityRole.PLATFORM,
      })
      .where('integrationAccount.integration = :integration', {
        integration: integrationTypeFromDomain(params.integration),
      })
      .andWhere('(integrationAccount.currency = :currency OR integrationAccount.currency IS NULL)', {
        currency: params.currency,
      })
      .orderBy(`CASE WHEN integrationAccount.currency = :currency THEN 0 ELSE 1 END`, 'ASC')
      .setParameter('currency', params.currency)
      .getOne()

    return result ? IntegrationAccountLinkRepositoryMapper.toDomain(result, result.integrationAccount!) : null
  }

  async getActive(param: GetActiveLinkParams, ctx?: TxContext): Promise<ReadonlyArray<IntegrationAccountLinkModel>> {
    const em = ctx?.em ?? this.datasource.manager

    const result = await em.find(IntegrationAccountLinkEntity, {
      where: {
        integrationAccount: {
          integration: integrationTypeFromDomain(param.integration),
          account: In(Array.from(param.accounts)),
        },
        status: LinkEntityStatus.ACTIVE,
      },
      relations: ['integrationAccount'],
    })

    return result.map((item) => IntegrationAccountLinkRepositoryMapper.toDomain(item, item.integrationAccount!))
  }

  async assignAccount(
    param: Omit<IntegrationAccountLinkData, 'status' | 'linkType'>,
    ctx: TxContext,
  ): Promise<IntegrationAccountLinkModel> {
    const entity = IntegrationAccountLinkRepositoryMapper.fromDomain(
      {
        ...param,
        status: LinkModelStatus.ACTIVE,
        linkType: LinkModelType.TEMPORAL,
      },
      ctx.em,
    )
    const result = await ctx.em.save(IntegrationAccountLinkEntity, entity)

    const integrationAccount = IntegrationAccountRepositoryMapper.fromDomain(param.integrationAccount, ctx.em)

    return IntegrationAccountLinkRepositoryMapper.toDomain(result, integrationAccount)
  }
}
