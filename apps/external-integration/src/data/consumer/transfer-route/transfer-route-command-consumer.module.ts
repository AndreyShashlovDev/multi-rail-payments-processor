import { Module } from '@nestjs/common'
import { TransferRouteCommandConsumer } from './transfer-route-command.consumer'
import { TransferRouteKafkaDataSourceModule } from '../../data-source/kafka/transfer-route-kafka-data-source.module'

@Module({
  imports: [TransferRouteKafkaDataSourceModule],
  providers: [TransferRouteCommandConsumer],
  exports: [TransferRouteCommandConsumer],
})
export class TransferRouteCommandConsumerModule {}
