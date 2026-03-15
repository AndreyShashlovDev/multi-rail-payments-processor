import { IntegrationAccount } from '@app/types/integration-account'
import { IntegrationType } from '@app/shared'
import { IntegrationCurrency } from '@app/types'

export interface GetActiveLinkParams {
  readonly integration: IntegrationType
  readonly accounts: ReadonlySet<IntegrationAccount>
}

export interface GetPlatformAccountParams {
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
}
