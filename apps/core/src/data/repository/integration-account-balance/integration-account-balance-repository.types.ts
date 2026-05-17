import { IntegrationAccount, IntegrationCurrency, Numeric } from '@app/types'
import { IntegrationType } from '@app/shared'

export interface UpdateBalanceProjectionData {
  readonly account: IntegrationAccount
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
  readonly available: Numeric
}

export interface UpdateBalanceData {
  readonly projections: ReadonlyArray<UpdateBalanceProjectionData>
  readonly updatedAt: Date
}
