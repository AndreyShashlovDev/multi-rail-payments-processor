import { TransactionHandler } from '../transaction-handler'

export class ReorgHandler implements TransactionHandler {
  process(): Promise<void> {
    return Promise.resolve(undefined)
  }
}
