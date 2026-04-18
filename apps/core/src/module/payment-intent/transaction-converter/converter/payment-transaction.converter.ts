import { PaymentIntentModel } from '../../model/payment-intent.model'
import { IntegrationAccount, UUID, IntegrationCurrency } from '@app/types'
import { IntegrationAccountModel } from '../../../../shared/model/integration-account.model'
import { PaymentPriority } from '../converter-priority.constants'
import { AccountModel } from '../../../../shared/model/account.model'
import { TransactionContext } from '../../../../shared/projection/transaction-converter.engine'
import {
  BasicTransactionConverter,
  TransactionConverterResult,
} from '../../../../shared/projection/basic-transaction.converter'
import { IntegrationAccountLinkModel } from '../../../../shared/model/integration-account-link.model'
import { PaymentAmountAccumulatorModel } from '../../model/payment-amount-accumulator.model'
import { IntegrationCurrencyModel } from '../../../../shared/model/integration-currency.model'

export interface PaymentTransactionContext extends TransactionContext {
  readonly paymentIntents: ReadonlyArray<PaymentIntentModel>
  readonly integrationAccounts: ReadonlyMap<IntegrationAccount, IntegrationAccountModel>
  readonly accountsLink: ReadonlyMap<IntegrationAccount, IntegrationAccountLinkModel>
  readonly platformAccounts: ReadonlyMap<IntegrationAccount, AccountModel>
  readonly amounts: ReadonlyMap<UUID, ReadonlyArray<PaymentAmountAccumulatorModel>>
  readonly currencies: ReadonlyMap<IntegrationCurrency, IntegrationCurrencyModel>
}

export interface PaymentTransactionConverter extends BasicTransactionConverter<
  PaymentTransactionContext,
  TransactionConverterResult<PaymentTransactionContext>
> {
  readonly priority: PaymentPriority
}
