import { AbstractInteractor, Numeric, IntegrationCurrency } from '@app/types'

export interface CurrencyConverterParams {
  readonly from: {
    readonly amount: Numeric
    readonly currency: IntegrationCurrency
  }
  readonly to: {
    readonly currency: IntegrationCurrency
  }
}

export interface CurrencyConverterResult {
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

export abstract class CurrencyConverterProvider extends AbstractInteractor<
  CurrencyConverterParams,
  Promise<CurrencyConverterResult>
> {}
