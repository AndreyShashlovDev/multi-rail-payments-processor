import { BalanceChange, BasicBalanceChangeMetadata, BalanceChangeMetadata } from '@app/shared/types/balance-change'

export interface BalanceUpdatedResult<T extends BasicBalanceChangeMetadata = BalanceChangeMetadata> {
  readonly idempotencyKey: string
  readonly ver: number
  readonly changes: ReadonlyArray<BalanceChange<T>>
}
