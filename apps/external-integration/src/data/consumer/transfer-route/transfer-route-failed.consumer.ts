import { Injectable } from '@nestjs/common'
import { TRANSFER_ROUTE_FAILED_TOPIC_SET } from '@app/shared'
import { TransferRouteFailedEvent } from '@app/shared/services/transfer-execution/v1'
import { TransferRouteKafkaDataSource } from '../../data-source/kafka/transfer-route-kafka-data-source.service'
import { EventConsumer } from '../event.consumer'

@Injectable()
export class TransferRouteFailedConsumer extends EventConsumer<TransferRouteFailedEvent> {
  constructor(source: TransferRouteKafkaDataSource) {
    super(TransferRouteFailedEvent)
    source.setupHandler<TransferRouteFailedEvent>(
      TRANSFER_ROUTE_FAILED_TOPIC_SET,
      'orchestrator',
      async (payload) => await this.dispatch(payload),
    )
  }
}
