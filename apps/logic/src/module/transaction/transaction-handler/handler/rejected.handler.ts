import { TransactionHandler } from '../transaction-handler'

export class RejectedHandler implements TransactionHandler {
  process(): Promise<void> {
    return Promise.resolve(undefined)
  }
}
