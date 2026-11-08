import { AbstractInteractor } from '@app/types'
import { TransferModel } from '../model/transfer.model'
import { TransferEventWithIntent } from '../model/transaction-event.model'

export abstract class BasicTransactionInteractor<T> extends AbstractInteractor<T, Promise<void>> {
  // the intent reference is stored with the transfer (opaque for the executor) and echoed back in TRANSACTION events
  protected withIntent(transfers: ReadonlyArray<TransferModel>): ReadonlyArray<TransferEventWithIntent> {
    return transfers.map((transfer) => ({
      ...transfer,
      intent:
        transfer.transferIntentId !== null && transfer.intentType !== null && transfer.intentId !== null
          ? { id: transfer.transferIntentId, intentType: transfer.intentType, intentId: transfer.intentId }
          : null,
    }))
  }
}
