import { TransactionStatus } from '@app/shared'

export class WrongTransactionHandlerStatusException extends Error {
  constructor(expected: TransactionStatus, provided: TransactionStatus) {
    super(`Wrong transaction status ${provided} for handler type ${expected}`)
  }
}
