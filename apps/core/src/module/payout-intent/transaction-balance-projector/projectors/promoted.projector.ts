import { TransactionBalanceProjector } from '../../../../shared/projection/transaction-balance-projector'
import { BalanceChange } from '@app/shared/types/balance-change'
import { TransactionModel } from '../../../../shared/model/transaction.model'
import { TxContext } from '@app/shared'

export class PromotedProjector implements TransactionBalanceProjector {
  async process(_data: TransactionModel, _ctx: TxContext): Promise<ReadonlyArray<BalanceChange>> {
    return []
  }
}
