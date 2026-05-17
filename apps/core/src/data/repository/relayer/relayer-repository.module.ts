import { Module } from '@nestjs/common'
import { RelayerRepository } from './relayer.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { IntegrationAccountLinkEntity } from '../../data-source/postgres/entities/integration-account-link.entity'
import { AccountEntity } from '../../data-source/postgres/entities/account.entity'
import { IntegrationAccountBalanceEntity } from '../../data-source/postgres/entities/integration-account-balance.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [IntegrationAccountLinkEntity, AccountEntity, IntegrationAccountBalanceEntity],
      CorePostgresConfig.DATASOURCE_NAME,
    ),
  ],
  providers: [RelayerRepository],
  exports: [RelayerRepository],
})
export class RelayerRepositoryModule {}
