import { Balance, IntegrationType } from '@app/shared'
import { UUID, IntegrationCurrency, IntegrationAccount } from '@app/types'

export interface BalanceProjectionPlatformAccountData extends Balance {
  readonly accountId: UUID
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
}

export interface BalanceProjectionIntegrationAccountData extends Balance {
  readonly account: IntegrationAccount
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
}

export interface BalanceProjectionResult {
  readonly platform: ReadonlyArray<BalanceProjectionPlatformAccountData>
  readonly integration: ReadonlyArray<BalanceProjectionIntegrationAccountData>
}
