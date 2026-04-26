import { Module } from '@nestjs/common'
import { OutboxRepository } from './outbox.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OutboxEntity } from '../../data-source/postgres/entities/outbox.entity'
import { LedgerPostgresConfig } from '../../data-source/postgres/ledger-postgres.config'

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEntity], LedgerPostgresConfig.DATASOURCE_NAME)],
  providers: [OutboxRepository],
  exports: [OutboxRepository],
})
export class OutboxRepositoryModule {}
