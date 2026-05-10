import { IntegrationType } from '@app/shared/types'
import { IntegrationCurrency, CqrsQuery } from '@app/types'
import { PlatformFeeResponse } from '@app/shared/services/fee/v1/cqrs/platform-fee.response'

export class GetPlatformFeeQuery extends CqrsQuery<PlatformFeeResponse> {
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency

  constructor(integration: IntegrationType, currency: IntegrationCurrency) {
    super()
    this.integration = integration
    this.currency = currency
  }
}
