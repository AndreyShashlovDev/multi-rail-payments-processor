import { TransactionStatus } from '@app/shared'

export class TransactionHandlerNotFoundException extends Error {
  constructor(state: TransactionStatus) {
    super(`Payment transaction handler for state ${state} not found!`)
  }
}