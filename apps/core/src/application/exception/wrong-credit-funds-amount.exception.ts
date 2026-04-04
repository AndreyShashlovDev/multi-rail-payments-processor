import { Numeric } from '@app/types'

export class WrongCreditFundsAmountException extends Error {
  constructor(amount: Numeric) {
    super(`Amount must be more than 0 ${amount.toString()}`)
  }
}
