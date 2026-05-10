import { UUID, IntegrationCurrency, IntegrationAccount, RawNumeric } from '@app/types'
import { IntentType, IntegrationType, ExecutionType } from '@app/shared'

export interface TransferIntentCreateEventModel {
  readonly intentId: UUID
  readonly intentType: IntentType
  readonly executionType: ExecutionType
  readonly estimatedRawFee: RawNumeric
  readonly feeCurrency: IntegrationCurrency
  readonly fromRawAmount: RawNumeric
  readonly fromIntegration: IntegrationType
  readonly fromCurrency: IntegrationCurrency
  readonly from: IntegrationAccount
  readonly toRawAmount: RawNumeric
  readonly toIntegration: IntegrationType
  readonly toCurrency: IntegrationCurrency
  readonly to: IntegrationAccount
}
