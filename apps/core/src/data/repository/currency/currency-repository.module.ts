import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { IntegrationCurrencyEntity } from '../../data-source/postgres/entities/integration-currency.entity'
import { CurrencyRepository } from './currency.repository'

@Module({
  imports: [TypeOrmModule.forFeature([IntegrationCurrencyEntity], CorePostgresConfig.DATASOURCE_NAME)],
  providers: [CurrencyRepository],
  exports: [CurrencyRepository],
})
export class CurrencyRepositoryModule {}
