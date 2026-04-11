import { TransactionHandler } from '../../../../shared/transaction-handler/transaction-handler'

export class PreparedHandler implements TransactionHandler {
  process(): Promise<void> {
    return Promise.resolve(undefined)
  }
}
