import { Module } from '@nestjs/common'
import { IntegrationAccountLinkRepository } from './integration-account-link.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { IntegrationAccountLinkEntity } from '../../data-source/postgres/entities/integration-account-link.entity'
import { IntegrationAccountEntity } from '../../data-source/postgres/entities/integration-account.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [IntegrationAccountLinkEntity, IntegrationAccountEntity],
      CorePostgresConfig.DATASOURCE_NAME,
    ),
  ],
  providers: [IntegrationAccountLinkRepository],
  exports: [IntegrationAccountLinkRepository],
})
export class IntegrationAccountLinkRepositoryModule {}
