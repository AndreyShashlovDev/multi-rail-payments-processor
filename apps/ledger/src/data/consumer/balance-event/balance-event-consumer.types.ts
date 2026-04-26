import { IntegrationType } from '@app/shared'
import { BalanceChangeData } from '../../../module/balance/model/balance-change.data'

export interface BalanceChangeEvent {
  readonly uniqueKey: string
  readonly ver: number
  readonly integration: IntegrationType
  readonly changes: ReadonlyArray<BalanceChangeData>
}
