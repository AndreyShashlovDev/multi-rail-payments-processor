import { IntegrationAccountRepository } from '../../data/repository/integration-account/integration-account.repository'
import { TxContext } from '@app/shared/types/tx-context.type'
import { BalanceChange } from '@app/shared/types/balance-change'
import { TransactionModel } from '../model/transaction.model'
import { TransferModel } from '../model/transfer.model'
import { TransactionBalanceProjector } from './transaction-balance-projector'

export abstract class BasicProjector implements TransactionBalanceProjector {
  protected constructor(private readonly integrationAccountRepository: IntegrationAccountRepository) {}

  abstract process(transaction: TransactionModel, ctx: TxContext): Promise<ReadonlyArray<BalanceChange>>

  protected async filterSupportedTransfers(
    data: Pick<TransactionModel, 'transfers'>,
    ctx: TxContext,
  ): Promise<ReadonlyArray<TransferModel>> {
    const { transfers } = data

    if (transfers.length === 0) return []

    const addresses = new Set(transfers.flatMap((transfer) => [transfer.from, transfer.to]))
    const { existing } = await this.integrationAccountRepository.hasAccounts({ accounts: addresses }, ctx)

    return transfers.filter((transfer) => existing.has(transfer.from) || existing.has(transfer.to))
  }
}
