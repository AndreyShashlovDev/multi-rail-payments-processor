import { Injectable } from '@nestjs/common'
import { TransferRouteCommandConsumer } from '../../../../data/consumer/transfer-route/transfer-route-command.consumer'
import { ExecuteTransferRouteInteractor } from '../../interactor/execute-transfer-route/execute-transfer-route.interactor'

@Injectable()
export class TransferRouteCommandListener {
  constructor(
    transferRouteCommandConsumer: TransferRouteCommandConsumer,
    private readonly executeTransferRouteInteractor: ExecuteTransferRouteInteractor,
  ) {
    transferRouteCommandConsumer.subscribe({
      handler: async (command) => await this.executeTransferRouteInteractor.execute(command),
    })
  }
}
