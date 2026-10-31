import {
  TransactionEvent,
  TransferEventData,
  TransferEventIntentData,
} from '@app/shared/services/external-integration/v1'
import { TransactionEventData, TransferEventWithIntent } from '../model/transaction-event.model'

export class TransactionEventMapper {
  static toEvent(model: TransactionEventData): TransactionEvent {
    return new TransactionEvent(
      model.id,
      model.executionType,
      model.integration,
      model.initiator,
      model.sourceTxId,
      model.status,
      model.transfers.map((item) => TransactionEventMapper.transferToTransferData(item)),
      model.fee?.toString() ?? null,
      model.feeCurrency,
      model.blockTime?.toISOString() ?? null,
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
