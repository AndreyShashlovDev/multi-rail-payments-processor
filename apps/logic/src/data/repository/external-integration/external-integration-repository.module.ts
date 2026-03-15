import { Module } from '@nestjs/common'
import {
  IntegrationJetstreamDataSourceModule,
} from '../../data-source/nats-jetstream/integration/integration-jetstream-data-source.module'
import { ExternalIntegrationRepository } from './external-integration.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IntegrationAccountEntity } from '../../data-source/postgres/entities/integration-account.entity'
import { LogicPostgresConfig } from '../../data-source/postgres/logic-postgres.config'

@Module({
  imports: [
    TypeOrmModule.forFeature([IntegrationAccountEntity], LogicPostgresConfig.DATASOURCE_NAME),
    IntegrationJetstreamDataSourceModule,
  ],
  providers: [ExternalIntegrationRepository],
  exports: [ExternalIntegrationRepository],
})
export class ExternalIntegrationRepositoryModule {}
