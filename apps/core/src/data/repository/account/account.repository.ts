import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { DataSource, Not, In } from 'typeorm'
import { AccountModel } from '../../../shared/model/account.model'
import { AccountEntity, AccountEntityRole } from '../../data-source/postgres/entities/account.entity'
import { AccountRepositoryMapper } from './account-repository.mapper'
import { UUID, Mutable } from '@app/types'
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere'
import { TxContext } from '@app/shared/types/tx-context.type'

@Injectable()
export class AccountRepository {
  constructor(
    @InjectDataSource(CorePostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  /**
   * @deprecated just for demo remove it
   */
  async getRandomMerchant(skip?: ReadonlySet<UUID>): Promise<AccountModel | null> {
    const where: FindOptionsWhere<Mutable<AccountEntity, 'id'>> = {
      role: AccountEntityRole.MERCHANT,
    }

    if (skip) {
      where['id'] = Not(In(Array.from(skip)))
    }

    const result = await this.datasource.manager.findOne(AccountEntity, { where })

    return result ? AccountRepositoryMapper.toDomain(result) : null
  }

  async getByIds(ids: Set<UUID>, ctx?: TxContext): Promise<ReadonlyArray<AccountModel>> {
    const em = ctx?.em ?? this.datasource.manager
    const result = await em.find(AccountEntity, { where: { id: In(Array.from(ids)) } })

    return result.map((account) => AccountRepositoryMapper.toDomain(account))
  }
}
