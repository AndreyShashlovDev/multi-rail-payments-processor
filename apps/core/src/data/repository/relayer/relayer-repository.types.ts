import { IntegrationCurrency, Numeric, UUID, IntegrationAccount } from '@app/types'
import { IntegrationType } from '@app/shared'

export interface GetRelayerAccountParams {
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
  readonly amount: Numeric
}

export interface GetRelayerAccountResult {
  readonly platformAccountId: UUID
  readonly account: IntegrationAccount
}
