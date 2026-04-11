import { BalanceChange } from '@app/shared/types/balance-change'
import { TransactionModel } from '../../../../shared/model/transaction.model'
import { TransactionBalanceProjector } from '../../../../shared/projection/transaction-balance-projector'

export class FailedProjector implements TransactionBalanceProjector {
  async process(data: TransactionModel): Promise<ReadonlyArray<BalanceChange>> {
    console.log('Failed Projector', data)
    return []
  }
}
