import { UUID, IntegrationAccount } from '@app/types'
import { TransactionContext } from '../../../../shared/projection/transaction-converter.engine'
import { PayoutIntentModel } from '../../model/payout-intent.model'
import { PayoutPriority } from '../converter-priority.constants'
import {
  BasicTransactionConverter,
  TransactionConverterResult,
} from '../../../../shared/projection/basic-transaction.converter'
import { IntegrationAccountLinkModel } from '../../../../shared/model/integration-account-link.model'

export interface PayoutTransactionContext extends TransactionContext {
  readonly payoutIntents: ReadonlyMap<UUID, PayoutIntentModel>
  readonly platformAccountIds: ReadonlySet<IntegrationAccount>
  readonly accountLinks: ReadonlyMap<IntegrationAccount, IntegrationAccountLinkModel>
}

export interface PayoutTransactionConverter extends BasicTransactionConverter<
  PayoutTransactionContext,
  TransactionConverterResult<PayoutTransactionContext>
> {
  readonly priority: PayoutPriority
}
