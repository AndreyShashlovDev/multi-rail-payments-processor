import { Module } from '@nestjs/common'
import { IntegrationAccountLinkRepository } from './integration-account-link.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LogicPostgresConfig } from '../../data-source/postgres/logic-postgres.config'
import { IntegrationAccountLinkEntity } from '../../data-source/postgres/entities/integration-account-link.entity'
import { IntegrationAccountEntity } from '../../data-source/postgres/entities/integration-account.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [IntegrationAccountLinkEntity, IntegrationAccountEntity],
      LogicPostgresConfig.DATASOURCE_NAME,
    ),
  ],
  providers: [IntegrationAccountLinkRepository],
  exports: [IntegrationAccountLinkRepository],
})
export class IntegrationAccountLinkRepositoryModule {}
