import { IntegrationType } from '@app/shared'
import { IntegrationCurrency, Numeric, type UUID } from '@app/types'

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
