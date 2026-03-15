import {
  TransactionEvent,
  TransferEventData,
  TransferEventIntentData,
} from '@app/shared/services/external-integration/v1'
import { TransactionEventData, TransferEventWithIntent } from './transaction-event-repository.types'

export class TransactionEventRepositoryMapper {
  static transactionToEvent(model: TransactionEventData): TransactionEvent {
    return new TransactionEvent(
      model.id,
      model.sourceTxId,
      model.integration,
      model.status,
      model.transfers.map((item) => TransactionEventRepositoryMapper.transferToTransferData(item)),
      model.fee?.toString() ?? null,
      model.feeCurrency,
      model.blockTime,
    )
  }

  private static transferToTransferData(model: TransferEventWithIntent): TransferEventData {
    return new TransferEventData(
      model.id,
      model.index,
      model.initiator,
      model.from,
      model.to,
      model.amountRaw,
      model.currency,
      model.intent
        ? new TransferEventIntentData(model.intent.id, model.intent.intentType, model.intent.intentId)
        : null,
    )
  }
}
