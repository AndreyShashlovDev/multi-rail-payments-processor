import { BalanceChangeType, IntegrationType, IntentType } from '@app/shared'
import { UUID, IntegrationAccount, type IntegrationCurrency, Numeric, RawNumeric, Id } from '@app/types'
import { BalanceChangeMetadata, BalanceChange, BalanceChangeOperationType } from '@app/shared/types/balance-change'

export interface BalanceChangeDataMetadata extends Omit<
  BalanceChangeMetadata,
  'overpay' | 'expectedAmount' | 'actualAmount' | 'integrationFeeDiff'
> {
  readonly overpay?: RawNumeric
  readonly expectedAmount?: RawNumeric
  readonly actualAmount?: RawNumeric
  readonly integrationFeeDiff?: RawNumeric
}

export interface BalanceChangeData extends Omit<BalanceChange, 'metadata'> {
  readonly type: BalanceChangeType
  readonly intentType: IntentType | null
  readonly intentId: Id | UUID | null
  readonly operationType: BalanceChangeOperationType | null
  readonly platformAccountId: UUID | null
  readonly integrationAccount: IntegrationAccount | null
  readonly currency: IntegrationCurrency
  readonly integration: IntegrationType
  readonly amount: Numeric
  readonly metadata: BalanceChangeDataMetadata
}
