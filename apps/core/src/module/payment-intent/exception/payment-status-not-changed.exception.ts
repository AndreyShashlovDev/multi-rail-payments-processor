import { BalanceChange } from '@app/shared/types/balance-change'

export class PaymentStatusNotChangedException extends Error {
  constructor(changes: BalanceChange[]) {
    super(`Payment status not changed as expected! ${JSON.stringify(changes)}`)
  }
}
