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

export type IntentApplyResult =
  | { status: 'success'; intentId: UUID | Id | null; changes: ReadonlyArray<BalanceChangeData> }
  | {
      status: 'failed'
      intentId: UUID | Id | null
      changes: ReadonlyArray<BalanceChangeData>
      error: BalanceApplyError
    }

export type BalanceApplyError =
  | {
      code: 'INSUFFICIENT_FUNDS'
      integrationAccount: IntegrationAccount | null
      platformAccountId: UUID | null
      available: Numeric
      required: Numeric
    }
  | { code: 'PROJECTION_NOT_FOUND'; integrationAccount: IntegrationAccount | null; platformAccountId: UUID | null }
