import { TransactionBalanceProjector } from '../transaction-balance-projector'
import { TransactionModel } from '../../model/transaction.model'
import { BalanceChange } from '@app/shared/types/balance-change'

export class FailedProjector implements TransactionBalanceProjector {
  async process(data: TransactionModel): Promise<ReadonlyArray<BalanceChange>> {
    console.log('Failed Projector', data)
    return []
  }
}
