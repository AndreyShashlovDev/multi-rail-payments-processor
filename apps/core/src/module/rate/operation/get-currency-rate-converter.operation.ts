import { Injectable } from '@nestjs/common'
import { Numeric, IntegrationCurrency, AbstractInteractor } from '@app/types'
import { ConverterNotSupportingCurrencyException } from '../exception/converter-not-supporting-currency.exception'

export interface GetCurrencyConverterOperationParams {
  readonly from: {
    readonly amount: Numeric
    readonly currency: IntegrationCurrency
  }
  readonly to: {
    readonly currency: IntegrationCurrency
  }
}

export interface GetCurrencyConverterOperationResult {
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

@Injectable()
export class GetCurrencyRateConverterOperation extends AbstractInteractor<
  GetCurrencyConverterOperationParams,
  Promise<GetCurrencyConverterOperationResult>
> {
  // todo for example just native. write actual converter!
  async execute(params: GetCurrencyConverterOperationParams): Promise<GetCurrencyConverterOperationResult> {
    if (params.from.currency !== 'native') {
      throw new ConverterNotSupportingCurrencyException(params.from.currency)
    }

    if (params.to.currency !== 'native') {
      throw new ConverterNotSupportingCurrencyException(params.to.currency)
    }

    return {
      from: params.from,
      to: {
        currency: params.to.currency,
        amount: params.from.amount,
        rate: Numeric.create(1),
      },
    }
  }
}
