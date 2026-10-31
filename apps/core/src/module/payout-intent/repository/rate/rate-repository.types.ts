import { Numeric, IntegrationCurrency } from '@app/types'

export interface GetConversionRateParams {
  readonly from: {
    readonly amount: Numeric
    readonly currency: IntegrationCurrency
  }
  readonly to: {
    readonly currency: IntegrationCurrency
  }
}

export interface ConversionRateResult {
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
