import { TransactionHandler } from '../../../../shared/transaction-handler/transaction-handler'

export class PromotedHandler implements TransactionHandler {
  process(): Promise<void> {
    return Promise.resolve(undefined)
  }
}
