import { BalanceChange } from '@app/shared/types/balance-change'

export class PayoutStatusNotChangedException extends Error {
  constructor(changes: BalanceChange[]) {
    super(`Payout status not changed as expected! ${JSON.stringify(changes)}`)
  }
}
