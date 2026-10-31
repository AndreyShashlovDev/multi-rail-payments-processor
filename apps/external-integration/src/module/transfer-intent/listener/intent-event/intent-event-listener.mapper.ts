import { TransferIntentCreateEvent } from '@app/shared/services/external-integration/v1'
import { TransferIntentHeldEvent } from '@app/shared/services/external-integration/v1/event/transfer-intent-held.event'
import { TransferIntentCreateEventModel } from '../../model/transfer-intent.create-event.model'
import { TransferIntentHeldEventModel } from '../../model/transfer-intent-held-event.model'

export class IntentEventListenerMapper {
  static toCreateEventModel(event: TransferIntentCreateEvent): TransferIntentCreateEventModel {
    return {
      intentId: event.intentId,
      intentType: event.intentType,
      estimatedRawFee: event.estimatedRawFee,
      feeCurrency: event.feeCurrency,
      fromRawAmount: event.fromAmount,
      fromIntegration: event.fromIntegration,
      fromCurrency: event.fromCurrency,
      from: event.from,
      toRawAmount: event.toAmount,
      toIntegration: event.toIntegration,
      toCurrency: event.toCurrency,
      to: event.to,
    }
  }

  static toHeldEventModel(event: TransferIntentHeldEvent): TransferIntentHeldEventModel {
    return {
      uniqueKey: event.uniqueKey,
      intentType: event.intentType,
      intentData: event.intentData,
    }
  }
}
