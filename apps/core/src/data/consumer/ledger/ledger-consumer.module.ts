import { Module } from '@nestjs/common'
import { LedgerConsumer } from './ledger.consumer'
import { LedgerJetstreamDataSourceModule } from '../../data-source/nats-jetstream/ledger/ledger-jetstream-data-source.module'

@Module({
  imports: [LedgerJetstreamDataSourceModule],
  providers: [LedgerConsumer],
  exports: [LedgerConsumer],
})
export class LedgerConsumerModule {}
