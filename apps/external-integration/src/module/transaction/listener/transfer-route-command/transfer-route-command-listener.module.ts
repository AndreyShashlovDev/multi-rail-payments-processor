import { Module } from '@nestjs/common'
import { TransferRouteCommandListener } from './transfer-route-command.listener'
import { TransferRouteCommandConsumerModule } from '../../../../data/consumer/transfer-route/transfer-route-command-consumer.module'
import { ExecuteTransferRouteInteractorModule } from '../../interactor/execute-transfer-route/execute-transfer-route-interactor.module'

@Module({
  imports: [TransferRouteCommandConsumerModule, ExecuteTransferRouteInteractorModule],
  providers: [TransferRouteCommandListener],
})
export class TransferRouteCommandListenerModule {}
