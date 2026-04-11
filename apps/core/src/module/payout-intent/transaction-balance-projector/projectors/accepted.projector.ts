import { TransactionModel } from '../../../../shared/model/transaction.model'
import { BalanceChange } from '@app/shared/types/balance-change'
import { TransactionBalanceProjector } from '../../../../shared/projection/transaction-balance-projector'

export class AcceptedProjector implements TransactionBalanceProjector {
  async process(data: TransactionModel): Promise<ReadonlyArray<BalanceChange>> {
    console.log('Accepted Projector', data)
    return []
  }
}
