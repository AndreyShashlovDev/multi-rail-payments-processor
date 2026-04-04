import { TransactionBalanceProjector } from '../transaction-balance-projector'
import {
  IntegrationAccountRepository,
} from '../../../../data/repository/integration-account/integration-account.repository'
import { TransactionModel } from '../../model/transaction.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import { TransferModel } from '../../model/transfer.model'
import { BalanceChange } from '@app/shared/types/balance-change'

export abstract class BasicProjector implements TransactionBalanceProjector {
  protected constructor(private readonly integrationAccountRepository: IntegrationAccountRepository) {}

  abstract process(transaction: TransactionModel, ctx: TxContext): Promise<ReadonlyArray<BalanceChange>>

  protected async filterSupportedTransfers(
    data: Pick<TransactionModel, 'integration' | 'transfers'>,
    ctx: TxContext,
  ): Promise<ReadonlyArray<TransferModel>> {
    const { integration, transfers } = data

    if (transfers.length === 0) return []

    const addresses = new Set(transfers.flatMap((transfer) => [transfer.from, transfer.to]))
    const { existing } = await this.integrationAccountRepository.hasAccounts({ integration, addresses }, ctx)

    return transfers.filter((transfer) => existing.has(transfer.from) || existing.has(transfer.to))
  }
}
