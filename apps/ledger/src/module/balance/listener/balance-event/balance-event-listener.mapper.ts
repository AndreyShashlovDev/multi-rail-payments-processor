import { BalanceChangeRequestEvent } from '@app/shared/services/ledger/v1'
import { Numeric } from '@app/types'
import { BalanceChangeData } from '../../model/balance-change.data'

export class BalanceEventListenerMapper {
  static toDomain(event: BalanceChangeRequestEvent): ReadonlyArray<BalanceChangeData> {
    return event.changes.map((change) => ({
      ...change,
      integration: event.integration,
      amount: Numeric.create(change.amount),
    }))
  }
}
