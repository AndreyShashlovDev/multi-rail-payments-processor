import { TransactionModel } from '../../model/transaction.model'
import { BalanceChange } from '@app/shared/types/balance-change'
import {
  IntegrationAccountRepository,
} from '../../../../data/repository/integration-account/integration-account.repository'
import { PayoutConfirmedTransactionConverter } from '../../transaction-converter/transaction-converter.module'
import { TransactionDataLoader } from '../transaction-data-loader'
import { TransactionStatus } from '@app/shared'
import { WrongTransactionHandlerStatusException } from '../../exception/wrong-transaction-handler-status.exception'
import { PaymentIntentStatus } from '../../../payment-intent/model/payment-intent.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import { BasicProjector } from './basic-projector'

export class PreparedProjector extends BasicProjector {
  constructor(
    integrationAccountRepository: IntegrationAccountRepository,
    private readonly payoutConfirmedTransactionConverter: PayoutConfirmedTransactionConverter,
    private readonly transactionDataLoader: TransactionDataLoader,
  ) {
    super(integrationAccountRepository)
  }

  async process(transaction: TransactionModel, ctx: TxContext): Promise<ReadonlyArray<BalanceChange>> {
    if (transaction.status !== TransactionStatus.PREPARED) {
      throw new WrongTransactionHandlerStatusException(TransactionStatus.PREPARED, transaction.status)
    }

    const supportTransfers = await this.filterSupportedTransfers(transaction, ctx)
    const { payouts } = await this.transactionDataLoader.getLookupData(
      {
        transaction,
        transfers: supportTransfers,
        paymentConfig: { status: PaymentIntentStatus.CONFIRMING },
      },
      ctx,
    )

    return await this.payoutConfirmedTransactionConverter.process({
      transaction,
      transfers: supportTransfers,
      payoutIntents: payouts,
    })
  }
}
