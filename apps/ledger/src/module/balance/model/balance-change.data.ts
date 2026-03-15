import { BalanceChangeType, IntegrationType } from '@app/shared'
import { UUID, IntegrationAccount, type IntegrationCurrency, Numeric, RawNumeric } from '@app/types'
import type { BalanceChangeMetadata, BalanceChange } from '@app/shared/types/balance-change'

export interface BalanceChangeDataMetadata extends Omit<
  BalanceChangeMetadata,
  'overpay' | 'expectedAmount' | 'actualAmount' | 'integrationFeeDiff'
> {
  readonly overpay: RawNumeric
  readonly expectedAmount: RawNumeric
  readonly actualAmount: RawNumeric
  readonly integrationFeeDiff: RawNumeric
}

export class BalanceChangeData implements Omit<BalanceChange, 'metadata'> {
  readonly type: BalanceChangeType
  readonly platformAccountId: UUID | null
  readonly integrationAccount: IntegrationAccount | null
  readonly currency: IntegrationCurrency
  readonly integration: IntegrationType
  readonly amount: Numeric
  readonly metadata: BalanceChangeDataMetadata
}
