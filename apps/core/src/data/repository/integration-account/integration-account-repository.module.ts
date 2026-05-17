import { Module } from '@nestjs/common'
import { IntegrationAccountRepository } from './integration-account.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { IntegrationAccountEntity } from '../../data-source/postgres/entities/integration-account.entity'
import { AccountEntity } from '../../data-source/postgres/entities/account.entity'

@Module({
  imports: [TypeOrmModule.forFeature([IntegrationAccountEntity, AccountEntity], CorePostgresConfig.DATASOURCE_NAME)],
  providers: [IntegrationAccountRepository],
  exports: [IntegrationAccountRepository],
})
export class IntegrationAccountRepositoryModule {}
