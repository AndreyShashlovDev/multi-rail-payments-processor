import { Module } from '@nestjs/common'
import { BalanceRepository } from './balance.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LedgerPostgresConfig } from '../../data-source/postgres/ledger-postgres.config'
import { IntegrationAccountEsEntity } from '../../data-source/postgres/entities/integration-account-es.entity'
import {
  IntegrationAccountProjectionEntity,
} from '../../data-source/postgres/entities/integration-account-projection.entity'
import { PlatformAccountEsEntity } from '../../data-source/postgres/entities/platform-account-es.entity'
import { PlatformAccountProjectionEntity } from '../../data-source/postgres/entities/platform-account-projection.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        IntegrationAccountEsEntity,
        IntegrationAccountProjectionEntity,
        PlatformAccountEsEntity,
        PlatformAccountProjectionEntity,
      ],
      LedgerPostgresConfig.DATASOURCE_NAME,
    ),
  ],
  providers: [BalanceRepository],
  exports: [BalanceRepository],
})
export class BalanceRepositoryModule {}
