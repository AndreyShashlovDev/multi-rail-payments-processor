import { AbstractInteractor } from '@app/types'
import { TransferModel } from '../model/transfer.model'
import { TransferEventWithIntent } from '../../../data/repository/transaction-event/transaction-event-repository.types'
import { TransferIntentRepository } from '../../../data/repository/transfer-intent/transfer-intent.repository'
import { TxContext } from '@app/shared/types/tx-context.type'

export abstract class BasicTransactionInteractor<T> extends AbstractInteractor<T, Promise<void>> {
  protected constructor(protected readonly transferIntentRepository: TransferIntentRepository) {
    super()
  }

  protected async mergeTransfersWithTransferIntent(
    transfer: ReadonlyArray<TransferModel>,
    ctx?: TxContext,
  ): Promise<ReadonlyArray<TransferEventWithIntent>> {
    const ids = new Set(
      transfer.filter((transfer) => transfer.transferIntentId).map((transfer) => transfer.transferIntentId!),
    )

    if (ids.size === 0) {
      return []
    }

    const intents = await this.transferIntentRepository.get(ids, ctx)
    const intentsByKey = new Map(intents.map((intent) => [intent.id, intent]))

    return transfer.map((transfer) => {
      const intent = transfer.transferIntentId ? (intentsByKey.get(transfer.transferIntentId) ?? null) : null

      return {
        ...transfer,
        intent,
      }
    })
  }
}
