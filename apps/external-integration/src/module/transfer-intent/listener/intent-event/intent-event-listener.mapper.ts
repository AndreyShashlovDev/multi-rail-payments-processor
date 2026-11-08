import { TransferIntentCreateEvent } from '@app/shared/services/external-integration/v1'
import { TransferIntentCreateEventModel } from '../../model/transfer-intent.create-event.model'

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
}
