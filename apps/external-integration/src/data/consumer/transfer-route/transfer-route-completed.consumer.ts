import { Injectable } from '@nestjs/common'
import { TRANSFER_ROUTE_COMPLETED_TOPIC_SET } from '@app/shared'
import { TransferRouteCompletedEvent } from '@app/shared/services/transfer-execution/v1'
import { TransferRouteKafkaDataSource } from '../../data-source/kafka/transfer-route-kafka-data-source.service'
import { EventConsumer } from '../event.consumer'

@Injectable()
export class TransferRouteCompletedConsumer extends EventConsumer<TransferRouteCompletedEvent> {
  constructor(source: TransferRouteKafkaDataSource) {
    super(TransferRouteCompletedEvent)
    source.setupHandler<TransferRouteCompletedEvent>(
      TRANSFER_ROUTE_COMPLETED_TOPIC_SET,
      'orchestrator',
      async (payload) => await this.dispatch(payload),
    )
  }
}
