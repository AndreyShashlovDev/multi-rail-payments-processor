import { TransactionModel } from '../model/transaction.model'
import { TxContext } from '@app/shared/types/tx-context.type'

export interface TransactionHandler {
  process(data: TransactionModel, ctx: TxContext): Promise<void>
}
