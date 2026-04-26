import { BalanceChangeData } from '../../../module/balance/model/balance-change.data'
import { BalanceApplyError } from '@app/shared/services/ledger/v1/event/balance-failed.event'

export interface BalanceUpdatedData {
  readonly uniqueKey: string
  readonly changes: ReadonlyArray<BalanceChangeData>
}

export interface BalanceFailedData extends BalanceUpdatedData {
  readonly errors: ReadonlyArray<BalanceApplyError>
}
