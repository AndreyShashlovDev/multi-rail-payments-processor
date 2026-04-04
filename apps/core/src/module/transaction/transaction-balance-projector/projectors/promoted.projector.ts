import { TransactionBalanceProjector } from '../transaction-balance-projector'
import { TransactionModel } from '../../model/transaction.model'
import { BalanceChange } from '@app/shared/types/balance-change'

export class PromotedProjector implements TransactionBalanceProjector {
  async process(_data: TransactionModel): Promise<ReadonlyArray<BalanceChange>> {
    console.log('Promoted Projector')
    return []
  }
}
