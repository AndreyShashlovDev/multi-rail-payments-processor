import { Module } from '@nestjs/common'
import { TransferRoutePublisher } from './transfer-route.publisher'
import { OutboxRepositoryModule } from '../../repository/outbox/outbox-repository.module'
import { SignatureServiceModule } from '../../../shared/signature/signature-service.module'
import { TransferRouteKafkaDataSourceModule } from '../../data-source/kafka/transfer-route-kafka-data-source.module'

@Module({
  imports: [TransferRouteKafkaDataSourceModule, OutboxRepositoryModule, SignatureServiceModule],
  providers: [TransferRoutePublisher],
  exports: [TransferRoutePublisher],
})
export class TransferRoutePublisherModule {}
