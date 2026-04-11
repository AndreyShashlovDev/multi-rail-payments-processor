import { TransactionStatus } from '@app/shared'
import { TxContext } from '@app/shared/types/tx-context.type'
import { TransactionModel } from '../model/transaction.model'
import { TransactionHandlerNotFoundException } from './exception/transaction-handler-not-found.exception'
import { TransactionHandler } from './transaction-handler'

export class TransactionHandlerStrategy implements TransactionHandler {
  constructor(private readonly handlers: Map<TransactionStatus, TransactionHandler>) {}

  async process(data: TransactionModel, ctx: TxContext): Promise<void> {
    const handler = this.handlers.get(data.status)

    if (!handler) {
      throw new TransactionHandlerNotFoundException(data.status)
    }

    return await handler.process(data, ctx)
  }
}
