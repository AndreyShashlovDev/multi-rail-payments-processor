import { IntentType, IntegrationType, ExchangeType } from '@app/shared'
import { UUID, IntegrationCurrency, Numeric, type IntegrationAccount } from '@app/types'

export interface TransferIntentHeldData {
  readonly intentType: IntentType
  readonly intentIds: ReadonlyArray<UUID>
}

export interface EnqueueTransferCreateData {
  readonly transfer: TransferIntentData
  readonly exponentByCurrency: ReadonlyMap<IntegrationType, ReadonlyMap<IntegrationCurrency, number>>
}

export interface TransferIntentData {
  readonly intentId: UUID
  readonly intentType: IntentType
  readonly exchangeType: ExchangeType
  readonly estimatedFee: Numeric
  readonly feeCurrency: IntegrationCurrency
  readonly fromAmount: Numeric
  readonly fromIntegration: IntegrationType
  readonly fromCurrency: IntegrationCurrency
  readonly from: IntegrationAccount
  readonly toAmount: Numeric
  readonly toIntegration: IntegrationType
  readonly toCurrency: IntegrationCurrency
  readonly to: IntegrationAccount
}
