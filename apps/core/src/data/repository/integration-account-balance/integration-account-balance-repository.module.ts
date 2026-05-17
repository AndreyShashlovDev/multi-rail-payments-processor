import { Module } from '@nestjs/common'
import { IntegrationAccountBalanceRepository } from './integration-account-balance.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { IntegrationAccountBalanceEntity } from '../../data-source/postgres/entities/integration-account-balance.entity'

@Module({
  imports: [TypeOrmModule.forFeature([IntegrationAccountBalanceEntity], CorePostgresConfig.DATASOURCE_NAME)],
  providers: [IntegrationAccountBalanceRepository],
  exports: [IntegrationAccountBalanceRepository],
})
export class IntegrationAccountBalanceRepositoryModule {}
