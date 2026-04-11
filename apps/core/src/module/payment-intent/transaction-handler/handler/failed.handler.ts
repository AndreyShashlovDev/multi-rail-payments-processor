import { TransactionHandler } from '../../../../shared/transaction-handler/transaction-handler'

export class FailedHandler implements TransactionHandler {
  process(): Promise<void> {
    return Promise.resolve(undefined)
  }
}
