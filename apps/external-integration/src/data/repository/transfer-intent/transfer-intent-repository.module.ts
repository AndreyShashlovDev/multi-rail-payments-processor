import { Module } from '@nestjs/common'
import { TransferIntentRepository } from './transfer-intent.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IntegrationPostgresConfig } from '../../data-source/postgres/integration-postgres.config'
import { TransferIntentEntity } from '../../data-source/postgres/entities/transfer-intent.entity'
import { LogicJetstreamDataSourceModule } from '../../data-source/nats-jetstream/logic-jetstream-data-source.module'

@Module({
  imports: [
    LogicJetstreamDataSourceModule,
    TypeOrmModule.forFeature([TransferIntentEntity], IntegrationPostgresConfig.DATASOURCE_NAME),
  ],
  providers: [TransferIntentRepository],
  exports: [TransferIntentRepository],
})
export class TransferIntentRepositoryModule {}
