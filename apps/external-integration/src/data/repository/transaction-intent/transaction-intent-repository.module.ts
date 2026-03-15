import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IntegrationPostgresConfig } from '../../data-source/postgres/integration-postgres.config'
import { TransactionIntentEntity } from '../../data-source/postgres/entities/transaction-intent.entity'
import { TransactionIntentRepository } from './transaction-intent.repository'

@Module({
  imports: [TypeOrmModule.forFeature([TransactionIntentEntity], IntegrationPostgresConfig.DATASOURCE_NAME)],
  providers: [TransactionIntentRepository],
  exports: [TransactionIntentRepository],
})
export class TransactionIntentRepositoryModule {}
