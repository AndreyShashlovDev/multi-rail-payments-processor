import { BalanceChange } from '@app/shared/types/balance-change'
import { PaymentTransactionDataLoader } from '../payment-transaction-data-loader.service'
import { TransactionStatus } from '@app/shared'
import { PaymentTransactionConverter } from '../../transaction-converter/transaction-converter.module'
import { TxContext } from '@app/shared/types/tx-context.type'
import { TransactionModel } from '../../../../shared/model/transaction.model'
import { PaymentIntentStatus } from '../../model/payment-intent.model'
import { WrongTransactionHandlerStatusException } from '../../exception/wrong-transaction-handler-status.exception'
import { TransactionBalanceProjector } from '../../../../shared/projection/transaction-balance-projector'

export class ConfirmedProjector implements TransactionBalanceProjector {
  constructor(
    private readonly paymentConverterEngine: PaymentTransactionConverter,
    private readonly transactionDataLoader: PaymentTransactionDataLoader,
  ) {}

  async process(transaction: TransactionModel, ctx: TxContext): Promise<ReadonlyArray<BalanceChange>> {
    if (transaction.status !== TransactionStatus.CONFIRMED) {
      throw new WrongTransactionHandlerStatusException(TransactionStatus.CONFIRMED, transaction.status)
    }

    const { integrationAccounts, accountsLink, payments, accountsForPayment, actualTransfers, amounts, currencies } =
      await this.transactionDataLoader.getLookupData(
        {
          transaction,
          paymentConfig: { status: new Set([PaymentIntentStatus.PROCESSING]) },
        },
        ctx,
      )

    return await this.paymentConverterEngine.process({
      transaction,
      transfers: actualTransfers,
      paymentIntents: payments,
      integrationAccounts,
      accountsLink,
      platformAccounts: accountsForPayment,
      amounts,
      currencies,
    })
  }
}
