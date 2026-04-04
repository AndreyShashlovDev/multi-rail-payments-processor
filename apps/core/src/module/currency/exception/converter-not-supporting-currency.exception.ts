import { IntegrationCurrency } from '@app/types'

export class ConverterNotSupportingCurrencyException extends Error {
  constructor(currency: IntegrationCurrency) {
    super(`Converter cannot convert unknown currency: ${currency}`)
  }
}
