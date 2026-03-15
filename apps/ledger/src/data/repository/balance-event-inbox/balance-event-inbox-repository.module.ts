import { Module } from '@nestjs/common'
import { BalanceEventInboxRepository } from './balance-event-inbox.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LedgerPostgresConfig } from '../../data-source/postgres/ledger-postgres.config'
import { BalanceEventInboxEntity } from '../../data-source/postgres/entities/balance-event-inbox.entity'

@Module({
  imports: [TypeOrmModule.forFeature([BalanceEventInboxEntity], LedgerPostgresConfig.DATASOURCE_NAME)],
  providers: [BalanceEventInboxRepository],
  exports: [BalanceEventInboxRepository],
})
export class BalanceEventInboxRepositoryModule {}
