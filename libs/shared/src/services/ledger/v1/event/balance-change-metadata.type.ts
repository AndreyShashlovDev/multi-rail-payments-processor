import { RawNumeric } from '@app/types'
import { BalanceChangeMetadata } from '@app/shared/types/balance-change'

export interface BalanceChangeDataMetadata extends Omit<
  BalanceChangeMetadata,
  'overpay' | 'expectedAmount' | 'integrationFeeDiff'
> {
  readonly overpay?: RawNumeric
  readonly expectedAmount?: RawNumeric
  readonly integrationFeeDiff?: RawNumeric
}
