import { TransferIntentCreateEventModel } from '../../model/transfer-intent.create-event.model'
import { TransferIntentCreateInteractor } from '../../interactor/create-transfer-intent/transfer-intent-create.interactor'
import { TransferIntentConsumer } from '../../../../data/consumer/transfer-intent/transfer-intent.consumer'
import { Injectable, Logger } from '@nestjs/common'
import { IntentEventListenerMapper } from './intent-event-listener.mapper'

@Injectable()
export class IntentEventListener {
  private readonly logger: Logger = new Logger(IntentEventListener.name)

  constructor(
    transferIntentConsumer: TransferIntentConsumer,
    private readonly transferIntentCreateInteractor: TransferIntentCreateInteractor,
  ) {
    transferIntentConsumer.subscribeToTransferIntentEvent<'create'>({
      filter: { type: 'create' },
      handler: async (event) =>
        await this.handleTransferIntentCreateEvent(IntentEventListenerMapper.toCreateEventModel(event)),
    })
  }

  async handleTransferIntentCreateEvent(data: TransferIntentCreateEventModel): Promise<void> {
    await this.transferIntentCreateInteractor.execute({
      ...data,
      fromAccount: data.from,
      toAccount: data.to,
    })
  }
}
