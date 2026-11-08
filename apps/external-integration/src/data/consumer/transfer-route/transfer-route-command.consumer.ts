import { Injectable } from '@nestjs/common'
import { TRANSFER_ROUTE_COMMAND_TOPIC_SET } from '@app/shared'
import { ExecuteTransferRouteCommand } from '@app/shared/services/transfer-execution/v1'
import { TransferRouteKafkaDataSource } from '../../data-source/kafka/transfer-route-kafka-data-source.service'
import { EventConsumer } from '../event.consumer'

@Injectable()
export class TransferRouteCommandConsumer extends EventConsumer<ExecuteTransferRouteCommand> {
  constructor(source: TransferRouteKafkaDataSource) {
    super(ExecuteTransferRouteCommand)
    source.setupHandler<ExecuteTransferRouteCommand>(
      TRANSFER_ROUTE_COMMAND_TOPIC_SET,
      'executor',
      async (payload) => await this.dispatch(payload),
    )
  }
}
