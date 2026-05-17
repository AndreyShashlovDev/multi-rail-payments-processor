import { BalanceChange, BasicBalanceChangeMetadata, BalanceChangeMetadata } from '@app/shared/types/balance-change'
import type { IntegrationAccount, IntegrationCurrency, Numeric } from '@app/types'
import { IntegrationType, IntentType, BalanceChangeType } from '@app/shared'

export interface BalanceUpdatedSubscription {
  readonly handler: (item: BalanceUpdatedResult) => Promise<void>
  readonly filter?: {
    readonly intentType?: IntentType
    readonly status?: ReadonlySet<BalanceChangeType>
  }
}

export interface BalanceProjectionUpdatedSubscription {
  readonly handler: (item: BalanceProjectionUpdatedResult) => Promise<void>
}

export interface BalanceUpdatedResult<T extends BasicBalanceChangeMetadata = BalanceChangeMetadata> {
  readonly idempotencyKey: string
  readonly ver: number
  readonly changes: ReadonlyArray<BalanceChange<T>>
}

export interface ProjectionData {
  readonly account: IntegrationAccount
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
  readonly available: Numeric
}

export interface BalanceProjectionUpdatedResult {
  readonly idempotencyKey: string
  readonly ver: number
  readonly projections: ReadonlyArray<ProjectionData>
  readonly date: Date
}
