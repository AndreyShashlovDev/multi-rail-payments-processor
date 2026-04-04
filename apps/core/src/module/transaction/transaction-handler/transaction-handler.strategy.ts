import { TransactionHandler } from './transaction-handler'
import { TransactionModel } from '../model/transaction.model'
import { TransactionProjectorNotFoundException } from '../exception/transaction-projector-not-found.exception'
import { TransactionStatus } from '@app/shared'
import { TxContext } from '@app/shared/types/tx-context.type'

export class TransactionHandlerStrategy implements TransactionHandler {
  constructor(private readonly handlers: Map<TransactionStatus, TransactionHandler>) {}

  async process(data: TransactionModel, ctx: TxContext): Promise<void> {
    const handler = this.handlers.get(data.status)

    if (!handler) {
      throw new TransactionProjectorNotFoundException(data.status)
    }

    return await handler.process(data, ctx)
  }
}
