import { Balance, IntegrationType } from '@app/shared'
import { UUID, IntegrationCurrency, IntegrationAccount, Numeric, Id } from '@app/types'
import { BalanceChangeData } from '../../../module/balance/model/balance-change.data'

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

export interface IntentGroup {
  readonly intentId: UUID | Id | null
  readonly changes: ReadonlyArray<BalanceChangeData>
}

export class ProjectionUpdateData {
  readonly account: IntegrationAccount
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
  readonly available: Numeric
}

export type IntentApplyResult =
  | {
      readonly status: 'success'
      readonly intentId: UUID | Id | null
      readonly changes: ReadonlyArray<BalanceChangeData>
      readonly updates: ReadonlyArray<ProjectionUpdateData>
    }
  | {
      readonly status: 'failed'
      readonly intentId: UUID | Id | null
      readonly changes: ReadonlyArray<BalanceChangeData>
      readonly error: BalanceApplyError
    }

export type BalanceApplyError =
  | {
      readonly code: 'INSUFFICIENT_FUNDS'
      readonly integrationAccount: IntegrationAccount | null
      readonly platformAccountId: UUID | null
      readonly available: Numeric
      readonly required: Numeric
    }
  | {
      readonly code: 'PROJECTION_NOT_FOUND'
      readonly integrationAccount: IntegrationAccount | null
      readonly platformAccountId: UUID | null
    }
