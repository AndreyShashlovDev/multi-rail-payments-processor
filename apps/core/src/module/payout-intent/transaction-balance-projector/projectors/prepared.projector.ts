import { TransactionModel } from '../../../../shared/model/transaction.model'
import { BalanceChange } from '@app/shared/types/balance-change'
import { IntegrationAccountRepository } from '../../../../data/repository/integration-account/integration-account.repository'
import { PayoutPreparedTransactionConverter } from '../../transaction-converter/transaction-converter.module'
import { PayoutTransactionDataLoader } from '../payout-transaction-data-loader.service'
import { TransactionStatus } from '@app/shared'
import { WrongTransactionHandlerStatusException } from '../../exception/wrong-transaction-handler-status.exception'
import { TxContext } from '@app/shared/types/tx-context.type'
import { BasicProjector } from '../../../../shared/projection/basic-projector'

export class PreparedProjector extends BasicProjector {
  constructor(
    integrationAccountRepository: IntegrationAccountRepository,
    private readonly payoutPreparedTransactionConverter: PayoutPreparedTransactionConverter,
    private readonly transactionDataLoader: PayoutTransactionDataLoader,
  ) {
    super(integrationAccountRepository)
  }

  async process(transaction: TransactionModel, ctx: TxContext): Promise<ReadonlyArray<BalanceChange>> {
    if (transaction.status !== TransactionStatus.PREPARED) {
      throw new WrongTransactionHandlerStatusException(TransactionStatus.PREPARED, transaction.status)
    }

    const supportTransfers = await this.filterSupportedTransfers(transaction, ctx)
    const { payouts, platformAccountIds, accountLinks } = await this.transactionDataLoader.getLookupData(
      { transaction, transfers: supportTransfers },
      ctx,
    )

    return await this.payoutPreparedTransactionConverter.process({
      transaction,
      transfers: supportTransfers,
      payoutIntents: payouts,
      platformAccountIds,
      accountLinks,
    })
  }
}
