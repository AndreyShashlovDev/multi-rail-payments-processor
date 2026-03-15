import { TransactionHandler } from '../transaction-handler'

export class FailedHandler implements TransactionHandler {
  process(): Promise<void> {
    return Promise.resolve(undefined)
  }
}
