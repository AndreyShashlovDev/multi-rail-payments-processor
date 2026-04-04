import { Module } from '@nestjs/common'
import {
  IntegrationJetstreamDataSourceModule,
} from '../../data-source/nats-jetstream/integration/integration-jetstream-data-source.module'
import { ExternalIntegrationRepository } from './external-integration.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IntegrationAccountEntity } from '../../data-source/postgres/entities/integration-account.entity'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'

@Module({
  imports: [
    TypeOrmModule.forFeature([IntegrationAccountEntity], CorePostgresConfig.DATASOURCE_NAME),
    IntegrationJetstreamDataSourceModule,
  ],
  providers: [ExternalIntegrationRepository],
  exports: [ExternalIntegrationRepository],
})
export class ExternalIntegrationRepositoryModule {}
