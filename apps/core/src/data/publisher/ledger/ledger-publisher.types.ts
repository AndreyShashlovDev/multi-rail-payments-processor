import { BalanceChange } from '@app/shared/types/balance-change'

export interface ChangeBalanceData {
  readonly idempotencyKey: string
  readonly changes: ReadonlyArray<BalanceChange>
}
