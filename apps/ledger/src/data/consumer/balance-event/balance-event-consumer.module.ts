import { Module } from '@nestjs/common'
import { BalanceEventConsumer } from './balance-event-consumer'
import { CoreJetstreamDataSourceModule } from '../../data-source/nats-jetstream/core/core-jetstream-data-source.module'

@Module({
  imports: [CoreJetstreamDataSourceModule],
  providers: [BalanceEventConsumer],
  exports: [BalanceEventConsumer],
})
export class BalanceEventConsumerModule {}
