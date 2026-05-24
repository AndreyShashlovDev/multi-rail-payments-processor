import { Module } from '@nestjs/common'
import { TransferRouteRepository } from './transfer-route.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IntegrationPostgresConfig } from '../../data-source/postgres/integration-postgres.config'
import { TransferRouteEntity } from '../../data-source/postgres/entities/transfer-route.entity'

@Module({
  imports: [TypeOrmModule.forFeature([TransferRouteEntity], IntegrationPostgresConfig.DATASOURCE_NAME)],
  providers: [TransferRouteRepository],
  exports: [TransferRouteRepository],
})
export class TransferRouteRepositoryModule {}
