import { TransferIntentCreateEventModel } from '../../model/transfer-intent.create-event.model'
import { TransferIntentHeldEventModel } from '../../model/transfer-intent-held-event.model'
import { TransferIntentCreateInteractor } from '../../interactor/create-transfer-intent/transfer-intent-create.interactor'
import { ProcessHeldTransferIntentInteractor } from '../../interactor/process-held-transfer-intent/process-held-transfer-intent.interactor'
import { TransferIntentConsumer } from '../../../../data/consumer/transfer-intent/transfer-intent.consumer'
import { Injectable, Logger } from '@nestjs/common'
import { IntentEventListenerMapper } from './intent-event-listener.mapper'

@Injectable()
export class IntentEventListener {
  private readonly logger: Logger = new Logger(IntentEventListener.name)

  constructor(
    transferIntentConsumer: TransferIntentConsumer,
    private readonly transferIntentCreateInteractor: TransferIntentCreateInteractor,
    private readonly processHeldTransferIntentInteractor: ProcessHeldTransferIntentInteractor,
  ) {
    transferIntentConsumer.subscribeToTransferIntentEvent<'create'>({
      filter: { type: 'create' },
      handler: async (event) =>
        await this.handleTransferIntentCreateEvent(IntentEventListenerMapper.toCreateEventModel(event)),
    })

    transferIntentConsumer.subscribeToTransferIntentEvent<'held'>({
      filter: { type: 'held' },
      handler: async (event) =>
        await this.handleTransferIntentHeldEvent(IntentEventListenerMapper.toHeldEventModel(event)),
    })
  }

  async handleTransferIntentCreateEvent(data: TransferIntentCreateEventModel): Promise<void> {
    await this.transferIntentCreateInteractor.execute({
      ...data,
      fromAccount: data.from,
      toAccount: data.to,
    })
  }

  async handleTransferIntentHeldEvent(data: TransferIntentHeldEventModel): Promise<void> {
    await this.processHeldTransferIntentInteractor.execute(data)
  }
}
