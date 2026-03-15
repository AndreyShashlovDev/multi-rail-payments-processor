import { Module } from '@nestjs/common'
import { TransactionRepository } from './transaction.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TransactionEntity } from '../../data-source/postgres/entities/transaction.entity'
import { IntegrationPostgresConfig } from '../../data-source/postgres/integration-postgres.config'

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEntity], IntegrationPostgresConfig.DATASOURCE_NAME)],
  providers: [TransactionRepository],
  exports: [TransactionRepository],
})
export class TransactionRepositoryModule {}
