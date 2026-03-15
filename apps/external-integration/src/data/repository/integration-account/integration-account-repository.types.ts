import { IntegrationAccount } from '@app/types'
import { IntegrationType } from '@app/shared'

export interface HasIntegrationAccountParams {
  readonly integration: IntegrationType
  readonly addresses: ReadonlySet<IntegrationAccount>
}

export interface HasIntegrationAccountResult {
  readonly existing: ReadonlySet<IntegrationAccount>
}
