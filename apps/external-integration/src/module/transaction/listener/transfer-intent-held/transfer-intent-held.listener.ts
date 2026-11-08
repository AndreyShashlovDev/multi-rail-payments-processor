import { Injectable } from '@nestjs/common'
import { TransferIntentConsumer } from '../../../../data/consumer/transfer-intent/transfer-intent.consumer'
import { ProcessHeldTransactionInteractor } from '../../interactor/process-held-transaction/process-held-transaction.interactor'

// HELD from Core is about our transactions (txId): the executor unlocks signing itself.
@Injectable()
export class TransferIntentHeldListener {
  constructor(
    transferIntentConsumer: TransferIntentConsumer,
    private readonly processHeldTransactionInteractor: ProcessHeldTransactionInteractor,
  ) {
    transferIntentConsumer.subscribeToTransferIntentEvent<'held'>({
      filter: { type: 'held' },
      handler: async (event) =>
        await this.processHeldTransactionInteractor.execute({
          uniqueKey: event.uniqueKey,
          txIds: new Set(event.intentData.map((item) => item.txId)),
        }),
    })
  }
}
