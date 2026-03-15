import { Numeric } from '@app/types'

export class InsufficientUserBalanceException extends Error {
  constructor(expected: Numeric, available?: Numeric) {
    super(`Insufficient user balance! expected ${expected.toString()}, available ${available?.toString()}`)
  }
}
