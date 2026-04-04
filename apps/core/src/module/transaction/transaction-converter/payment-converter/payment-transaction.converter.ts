import { PaymentIntentModel } from '../../../payment-intent/model/payment-intent.model'
import { IntegrationAccount, UUID } from '@app/types'
import { IntegrationAccountModel } from '../../../../shared/model/integration-account.model'
import { IntegrationAccountLinkModel } from '../../../../shared/model/integration-account-link.model'
import { TransactionContext } from '../transaction-converter.engine'
import { BasicTransactionConverter, TransactionConverterResult } from '../basic-transaction.converter'
import { PaymentPriority } from '../converter-priority.constants'
import { AccountModel } from '../../../../shared/model/account.model'

export interface PaymentTransactionContext extends TransactionContext {
  readonly paymentIntents: ReadonlyArray<PaymentIntentModel>
  readonly integrationAccounts: ReadonlyMap<IntegrationAccount, IntegrationAccountModel>
  readonly accountsLink: ReadonlyMap<IntegrationAccount, IntegrationAccountLinkModel>
  readonly platformAccounts: ReadonlyMap<IntegrationAccount, AccountModel>
}

export interface PaymentTransactionConverter extends BasicTransactionConverter<
  PaymentTransactionContext,
  TransactionConverterResult<PaymentTransactionContext>
> {
  readonly priority: PaymentPriority
}
