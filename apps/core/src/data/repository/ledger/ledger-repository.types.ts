import { IntegrationCurrency, UUID, IntegrationAccount } from '@app/types'
import { Balance, IntegrationType } from '@app/shared'

export interface GetBalancesResult {
  readonly platform: Map<UUID, Map<IntegrationType, Map<IntegrationCurrency, Balance>>>
  readonly integration: Map<IntegrationAccount, Map<IntegrationType, Map<IntegrationCurrency, Balance>>>
}
