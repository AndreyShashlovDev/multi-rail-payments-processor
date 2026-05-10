import { Numeric, IntegrationCurrency } from '@app/types'

export interface ConversionRateResponse {
  readonly from: {
    readonly amount: Numeric
    readonly currency: IntegrationCurrency
  }
  readonly to: {
    readonly amount: Numeric
    readonly rate: Numeric
    readonly currency: IntegrationCurrency
  }
}
