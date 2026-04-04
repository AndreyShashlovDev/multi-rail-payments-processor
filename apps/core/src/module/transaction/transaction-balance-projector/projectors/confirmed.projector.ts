import { TransactionModel } from '../../model/transaction.model'
import { BalanceChange } from '@app/shared/types/balance-change'
import { WrongTransactionHandlerStatusException } from '../../exception/wrong-transaction-handler-status.exception'
import { TransactionDataLoader } from '../transaction-data-loader'
import {
  IntegrationAccountRepository,
} from '../../../../data/repository/integration-account/integration-account.repository'
import { TransactionStatus } from '@app/shared'
import {
  PaymentTransactionConverter,
  PayoutConfirmedTransactionConverter,
} from '../../transaction-converter/transaction-converter.module'
import { PaymentIntentStatus } from '../../../payment-intent/model/payment-intent.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import { BasicProjector } from './basic-projector'

export class ConfirmedProjector extends BasicProjector {
  constructor(
    integrationAccountRepository: IntegrationAccountRepository,
    private readonly paymentConverterEngine: PaymentTransactionConverter,
    private readonly payoutConfirmedTransactionConverter: PayoutConfirmedTransactionConverter,
    private readonly transactionDataLoader: TransactionDataLoader,
  ) {
    super(integrationAccountRepository)
  }

  async process(transaction: TransactionModel, ctx: TxContext): Promise<ReadonlyArray<BalanceChange>> {
    if (transaction.status !== TransactionStatus.CONFIRMED) {
      throw new WrongTransactionHandlerStatusException(TransactionStatus.CONFIRMED, transaction.status)
    }

    const supportTransfers = await this.filterSupportedTransfers(transaction, ctx)
    const { integrationAccounts, accountsLink, payments, payouts, accountsForPayment } =
      await this.transactionDataLoader.getLookupData(
        {
          transaction,
          transfers: supportTransfers,
          paymentConfig: { status: PaymentIntentStatus.CONFIRMING },
        },
        ctx,
      )

    const paymentChanges = await this.paymentConverterEngine.process({
      transaction,
      transfers: supportTransfers,
      paymentIntents: payments,
      integrationAccounts,
      accountsLink,
      platformAccounts: accountsForPayment,
    })

    const payoutChanges = await this.payoutConfirmedTransactionConverter.process({
      transaction,
      transfers: supportTransfers,
      payoutIntents: payouts,
    })

    return [...paymentChanges, ...payoutChanges]
  }
}
