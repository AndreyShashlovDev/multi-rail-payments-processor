import type { IntegrationAccount, IntegrationCurrency, Numeric } from '@app/types'
import { IntegrationType } from '@app/shared'

export interface ProjectionEventData {
  readonly account: IntegrationAccount
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
  readonly available: Numeric
}

export interface BalanceProjectionUpdatedData {
  readonly date: Date
  readonly projections: ReadonlyArray<ProjectionEventData>
}
