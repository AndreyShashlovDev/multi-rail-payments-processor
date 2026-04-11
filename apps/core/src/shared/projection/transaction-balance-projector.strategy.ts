import { TransactionBalanceProjector } from './transaction-balance-projector'
import { TransactionModel } from '../model/transaction.model'
import { TransactionProjectorNotFoundException } from './exception/transaction-projector-not-found.exception'
import { BalanceChange } from '@app/shared/types/balance-change'
import { TransactionStatus, BalanceChangeType } from '@app/shared'
import { TxContext } from '@app/shared/types/tx-context.type'

export class TransactionBalanceProjectorStrategy implements TransactionBalanceProjector {
  private static readonly CHANGE_ORDER: Record<BalanceChangeType, number> = {
    [BalanceChangeType.RELEASE_HOLD]: 0,
    [BalanceChangeType.RELEASE_HOLD_IN]: 1,
    [BalanceChangeType.CREDIT]: 2,
    [BalanceChangeType.DEBIT]: 3,
    [BalanceChangeType.HOLD]: 4,
    [BalanceChangeType.HOLD_IN]: 5,
    [BalanceChangeType.PLATFORM_FEE_ACCRUED]: 6,
  }

  constructor(private readonly projectors: Map<TransactionStatus, TransactionBalanceProjector>) {}

  async process(data: TransactionModel, ctx: TxContext): Promise<ReadonlyArray<BalanceChange>> {
    const projector = this.projectors.get(data.status)

    if (!projector) {
      throw new TransactionProjectorNotFoundException(data.status)
    }

    const changes = await projector.process(data, ctx)

    return [...changes].sort(
      (a, b) =>
        TransactionBalanceProjectorStrategy.CHANGE_ORDER[a.type] -
        TransactionBalanceProjectorStrategy.CHANGE_ORDER[b.type],
    )
  }
}
