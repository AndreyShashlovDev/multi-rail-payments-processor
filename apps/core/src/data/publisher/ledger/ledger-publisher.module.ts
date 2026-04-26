import { Module } from '@nestjs/common'
import { LedgerPublisher } from './ledger.publisher'
import { LedgerJetstreamDataSourceModule } from '../../data-source/nats-jetstream/ledger/ledger-jetstream-data-source.module'
import { OutboxRepositoryModule } from '../../repository/outbox/outbox-repository.module'

@Module({
  imports: [LedgerJetstreamDataSourceModule, OutboxRepositoryModule],
  providers: [LedgerPublisher],
  exports: [LedgerPublisher],
})
export class LedgerPublisherModule {}
