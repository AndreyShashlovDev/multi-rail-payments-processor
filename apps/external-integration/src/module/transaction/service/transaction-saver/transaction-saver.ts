import { TransactionParseResult } from '../transaction-parser/transaction-parser'
import { TransactionModel } from '../../model/transaction.model'
import { TxContext } from '@app/shared/types/tx-context.type'

export interface TransactionSaver<T extends TransactionParseResult> {
  save(data: T, ctx?: TxContext): Promise<TransactionModel>
}
