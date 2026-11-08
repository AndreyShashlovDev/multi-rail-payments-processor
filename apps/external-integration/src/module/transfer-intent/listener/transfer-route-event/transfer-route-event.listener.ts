import { Injectable } from '@nestjs/common'
import { TransferRouteCompletedConsumer } from '../../../../data/consumer/transfer-route/transfer-route-completed.consumer'
import { TransferRouteFailedConsumer } from '../../../../data/consumer/transfer-route/transfer-route-failed.consumer'
import { ProcessTransferRouteCompletedInteractor } from '../../interactor/process-transfer-route-completed/process-transfer-route-completed.interactor'
import { ProcessTransferRouteFailedInteractor } from '../../interactor/process-transfer-route-failed/process-transfer-route-failed.interactor'

// Step events from the executors: the only way the orchestrator learns how its steps went.
@Injectable()
export class TransferRouteEventListener {
  constructor(
    transferRouteCompletedConsumer: TransferRouteCompletedConsumer,
    transferRouteFailedConsumer: TransferRouteFailedConsumer,
    private readonly processTransferRouteCompletedInteractor: ProcessTransferRouteCompletedInteractor,
    private readonly processTransferRouteFailedInteractor: ProcessTransferRouteFailedInteractor,
  ) {
    transferRouteCompletedConsumer.subscribe({
      handler: async (event) => await this.processTransferRouteCompletedInteractor.execute(event),
    })

    transferRouteFailedConsumer.subscribe({
      handler: async (event) => await this.processTransferRouteFailedInteractor.execute(event),
    })
  }
}
