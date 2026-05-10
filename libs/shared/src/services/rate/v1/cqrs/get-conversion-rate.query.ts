import { Numeric, IntegrationCurrency, CqrsQuery } from '@app/types'
import { ConversionRateResponse } from '@app/shared/services/rate/v1/cqrs/conversion-rate.response'

export class GetConversionRateQuery extends CqrsQuery<ConversionRateResponse> {
  readonly from: {
    readonly amount: Numeric
    readonly currency: IntegrationCurrency
  }
  readonly to: {
    readonly currency: IntegrationCurrency
  }

  constructor(
    from: { readonly amount: Numeric; readonly currency: IntegrationCurrency },
    to: { readonly currency: IntegrationCurrency },
  ) {
    super()
    this.from = from
    this.to = to
  }
}
