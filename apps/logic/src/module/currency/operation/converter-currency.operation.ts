import {
  CurrencyConverterProvider,
  CurrencyConverterParams,
  CurrencyConverterResult,
} from '../../../shared/currency/currency-converter.provider'
import { Injectable } from '@nestjs/common'
import { Numeric } from '@app/types'
import { ConverterNotSupportingCurrencyException } from '../exception/converter-not-supporting-currency.exception'

@Injectable()
export class ConverterCurrencyOperation extends CurrencyConverterProvider {
  // todo for example just native. write actual converter!
  async execute(params: CurrencyConverterParams): Promise<CurrencyConverterResult> {
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
