import { TransactionModel } from '../model/transaction.model'
import { BalanceChange } from '@app/shared/types/balance-change'
import { TxContext } from '@app/shared/types/tx-context.type'

export interface TransactionBalanceProjector<T extends BalanceChange = BalanceChange> {
  process(data: TransactionModel, ctx: TxContext): Promise<ReadonlyArray<T>>
}
