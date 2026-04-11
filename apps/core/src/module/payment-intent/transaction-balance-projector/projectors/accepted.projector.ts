import { BalanceChange } from '@app/shared/types/balance-change'
import { PaymentTransactionDataLoader } from '../payment-transaction-data-loader.service'
import {
  IntegrationAccountRepository,
} from '../../../../data/repository/integration-account/integration-account.repository'
import { TransactionStatus } from '@app/shared'
import { PaymentTransactionConverter } from '../../transaction-converter/transaction-converter.module'
import { TxContext } from '@app/shared/types/tx-context.type'
import { BasicProjector } from '../../../../shared/projection/basic-projector'
import { TransactionModel } from '../../../../shared/model/transaction.model'
import { PaymentIntentStatus } from '../../model/payment-intent.model'
import { WrongTransactionHandlerStatusException } from '../../exception/wrong-transaction-handler-status.exception'

export class AcceptedProjector extends BasicProjector {
  constructor(
    integrationAccountRepository: IntegrationAccountRepository,
    private readonly paymentConverterEngine: PaymentTransactionConverter,
    private readonly transactionDataLoader: PaymentTransactionDataLoader,
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
