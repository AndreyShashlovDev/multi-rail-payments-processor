import { Module } from '@nestjs/common'
import { TransferRouteFailedConsumer } from './transfer-route-failed.consumer'
import { TransferRouteKafkaDataSourceModule } from '../../data-source/kafka/transfer-route-kafka-data-source.module'

@Module({
  imports: [TransferRouteKafkaDataSourceModule],
  providers: [TransferRouteFailedConsumer],
  exports: [TransferRouteFailedConsumer],
})
export class TransferRouteFailedConsumerModule {}
