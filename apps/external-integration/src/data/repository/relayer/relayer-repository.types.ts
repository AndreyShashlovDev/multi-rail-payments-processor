import { IntegrationType } from '@app/shared'
import { IntegrationCurrency, RawNumeric } from '@app/types'

export interface GetRelayerAccountParams {
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
  readonly amount: RawNumeric
  readonly integrationFee: RawNumeric
}
