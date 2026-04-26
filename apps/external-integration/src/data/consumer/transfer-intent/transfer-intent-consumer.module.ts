import { Module } from '@nestjs/common'
import { TransferIntentConsumer } from './transfer-intent.consumer'
import { CoreJetstreamDataSourceModule } from '../../data-source/nats-jetstream/core-jetstream-data-source.module'

@Module({
  imports: [CoreJetstreamDataSourceModule],
  providers: [TransferIntentConsumer],
  exports: [TransferIntentConsumer],
})
export class TransferIntentConsumerModule {}
