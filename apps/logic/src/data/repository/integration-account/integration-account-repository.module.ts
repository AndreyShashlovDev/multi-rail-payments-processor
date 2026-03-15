import { Module } from '@nestjs/common'
import { IntegrationAccountRepository } from './integration-account.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LogicPostgresConfig } from '../../data-source/postgres/logic-postgres.config'
import { IntegrationAccountEntity } from '../../data-source/postgres/entities/integration-account.entity'

@Module({
  imports: [TypeOrmModule.forFeature([IntegrationAccountEntity], LogicPostgresConfig.DATASOURCE_NAME)],
  providers: [IntegrationAccountRepository],
  exports: [IntegrationAccountRepository],
})
export class IntegrationAccountRepositoryModule {}
