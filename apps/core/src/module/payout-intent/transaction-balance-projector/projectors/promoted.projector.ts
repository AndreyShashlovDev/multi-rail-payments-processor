import { TransactionBalanceProjector } from '../../../../shared/projection/transaction-balance-projector'
import { BalanceChange } from '@app/shared/types/balance-change'

export class PromotedProjector implements TransactionBalanceProjector {
  async process(): Promise<ReadonlyArray<BalanceChange>> {
    console.log('Promoted Projector')
    return []
  }
}
