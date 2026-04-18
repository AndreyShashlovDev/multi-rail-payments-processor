import { IntegrationType } from '@app/shared'
import type { IntegrationCurrency } from '@app/types'

export interface IntegrationCurrencyData {
  readonly code: string
  readonly name: string
  readonly symbol: string
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
  readonly displayDecimals: number
  readonly minorUnit: number
}

export interface IntegrationCurrencyModel extends IntegrationCurrencyData {
  readonly id: number
}
