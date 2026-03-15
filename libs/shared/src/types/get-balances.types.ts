import { Numeric, UUID, IntegrationCurrency, IntegrationAccount } from '@app/types'
import { IntegrationType } from '@app/shared/types/integration.type'

export interface Balance {
  readonly balance: Numeric
  readonly available: Numeric
  readonly hold: Numeric
  readonly holdIn: Numeric
}

export interface GetBalancesParams {
  readonly platform?: ReadonlyArray<GetPlatformAccountBalanceData>
  readonly integration?: ReadonlyArray<GetIntegrationAccountBalanceData>
}

export interface GetIntegrationAccountBalanceData {
  readonly account: IntegrationAccount
  readonly integration: IntegrationType
  readonly currencies: ReadonlySet<IntegrationCurrency>
}

export interface GetPlatformAccountBalanceData {
  readonly accountId: UUID
  readonly integration: IntegrationType
  readonly currencies: ReadonlySet<IntegrationCurrency>
}
