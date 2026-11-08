import { Module } from '@nestjs/common'
import { TransferRouteEventListener } from './transfer-route-event.listener'
import { TransferRouteCompletedConsumerModule } from '../../../../data/consumer/transfer-route/transfer-route-completed-consumer.module'
import { TransferRouteFailedConsumerModule } from '../../../../data/consumer/transfer-route/transfer-route-failed-consumer.module'
import { ProcessTransferRouteCompletedInteractorModule } from '../../interactor/process-transfer-route-completed/process-transfer-route-completed-interactor.module'
import { ProcessTransferRouteFailedInteractorModule } from '../../interactor/process-transfer-route-failed/process-transfer-route-failed-interactor.module'

@Module({
  imports: [
    TransferRouteCompletedConsumerModule,
    TransferRouteFailedConsumerModule,
    ProcessTransferRouteCompletedInteractorModule,
    ProcessTransferRouteFailedInteractorModule,
  ],
  providers: [TransferRouteEventListener],
})
export class TransferRouteEventListenerModule {}
