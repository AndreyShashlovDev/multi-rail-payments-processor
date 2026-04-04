import { TransactionModel } from '../../model/transaction.model'
import { BalanceChange } from '@app/shared/types/balance-change'
import { WrongTransactionHandlerStatusException } from '../../exception/wrong-transaction-handler-status.exception'
import { TransactionDataLoader } from '../transaction-data-loader'
import {
  IntegrationAccountRepository,
} from '../../../../data/repository/integration-account/integration-account.repository'
import { TransactionStatus } from '@app/shared'
import { PaymentTransactionConverter } from '../../transaction-converter/transaction-converter.module'
import { PaymentIntentStatus } from '../../../payment-intent/model/payment-intent.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import { BasicProjector } from './basic-projector'

export class AcceptedProjector extends BasicProjector {
  constructor(
    integrationAccountRepository: IntegrationAccountRepository,
    private readonly paymentConverterEngine: PaymentTransactionConverter,
    private readonly transactionDataLoader: TransactionDataLoader,
  ) {
    super(integrationAccountRepository)
  }

  async process(transaction: TransactionModel, ctx: TxContext): Promise<ReadonlyArray<BalanceChange>> {
    if (transaction.status !== TransactionStatus.ACCEPTED) {
      throw new WrongTransactionHandlerStatusException(TransactionStatus.ACCEPTED, transaction.status)
    }

    const supportTransfers = await this.filterSupportedTransfers(transaction, ctx)
    const { integrationAccounts, accountsLink, payments, accountsForPayment } =
      await this.transactionDataLoader.getLookupData(
        {
          transaction,
          transfers: supportTransfers,
          paymentConfig: { status: PaymentIntentStatus.CONFIRMING },
        },
        ctx,
      )

    return await this.paymentConverterEngine.process({
      transaction,
      transfers: supportTransfers,
      paymentIntents: payments,
      integrationAccounts,
      accountsLink,
      platformAccounts: accountsForPayment,
    })
  }
}
