import { BalanceChange } from '@app/shared/types/balance-change'
import { TransactionBalanceProjector } from '../../../../shared/projection/transaction-balance-projector'

export class PromotedProjector implements TransactionBalanceProjector {
  async process(): Promise<ReadonlyArray<BalanceChange>> {
    console.log('Promoted Projector')
    return []
  }
}
