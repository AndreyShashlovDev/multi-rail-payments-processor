import { PaymentIntentModel } from '../../model/payment-intent.model'
import { IntegrationAccount } from '@app/types'
import { IntegrationAccountModel } from '../../../../shared/model/integration-account.model'
import { PaymentPriority } from '../converter-priority.constants'
import { AccountModel } from '../../../../shared/model/account.model'
import { TransactionContext } from '../../../../shared/projection/transaction-converter.engine'
import {
  BasicTransactionConverter,
  TransactionConverterResult,
} from '../../../../shared/projection/basic-transaction.converter'
import { IntegrationAccountLinkModel } from '../../../../shared/model/integration-account-link.model'

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
