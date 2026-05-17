import { IntegrationCurrency, Numeric } from '@app/types'
import { IntegrationType } from '@app/shared'

export interface GetRelayerAccountParams {
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
  readonly amount: Numeric
}
