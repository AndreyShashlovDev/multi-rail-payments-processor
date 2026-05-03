import { TransactionBalanceProjector } from '../../../../shared/projection/transaction-balance-projector'
import { TransactionModel } from '../../../../shared/model/transaction.model'
import { BalanceChange } from '@app/shared/types/balance-change'
import { TxContext } from '@app/shared'

export class ReorgProjector implements TransactionBalanceProjector {
  async process(_data: TransactionModel, _ctx: TxContext): Promise<ReadonlyArray<BalanceChange>> {
    return []
  }
}
