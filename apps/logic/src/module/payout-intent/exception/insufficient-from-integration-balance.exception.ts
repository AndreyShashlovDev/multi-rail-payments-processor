import { Numeric } from '@app/types'

export class InsufficientFromIntegrationBalanceException extends Error {
  constructor(expected: Numeric, available?: Numeric) {
    super(
      `Insufficient 'from' integration balance! expected ${expected.toString()}, available ${available?.toString()}`,
    )
  }
}
