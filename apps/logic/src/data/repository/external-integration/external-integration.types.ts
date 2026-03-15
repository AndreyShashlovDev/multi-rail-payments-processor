import { IntegrationType, IntentType } from '@app/shared'
import { IntegrationCurrency, Numeric, type UUID, type IntegrationAccount } from '@app/types'

export interface EstimateTransferFeeData {
  readonly amount: Numeric
  readonly fromIntegration: IntegrationType
  readonly fromCurrency: IntegrationCurrency
  readonly toIntegration: IntegrationType
  readonly toCurrency: IntegrationCurrency
}

export interface EstimateTransferFeeResult {
  readonly id: UUID
  readonly integration: IntegrationType
  readonly amount: Numeric
  readonly currency: IntegrationCurrency
}

export interface TransactionIntentData {
  readonly intentId: UUID
  readonly intentType: IntentType
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

export interface TransferIntentHeldData {
  readonly intentType: IntentType
  readonly intentIds: ReadonlyArray<UUID>
}
