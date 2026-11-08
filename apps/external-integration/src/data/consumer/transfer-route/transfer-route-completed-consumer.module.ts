import { Module } from '@nestjs/common'
import { TransferRouteCompletedConsumer } from './transfer-route-completed.consumer'
import { TransferRouteKafkaDataSourceModule } from '../../data-source/kafka/transfer-route-kafka-data-source.module'

@Module({
  imports: [TransferRouteKafkaDataSourceModule],
  providers: [TransferRouteCompletedConsumer],
  exports: [TransferRouteCompletedConsumer],
})
export class TransferRouteCompletedConsumerModule {}
