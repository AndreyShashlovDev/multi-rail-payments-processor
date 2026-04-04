import { UUID } from '@app/types'
import { TransactionContext } from '../transaction-converter.engine'
import { BasicTransactionConverter, TransactionConverterResult } from '../basic-transaction.converter'
import { PayoutIntentModel } from '../../../payout-intent/model/payout-intent.model'
import { PayoutPriority } from '../converter-priority.constants'

export interface PayoutTransactionContext extends TransactionContext {
  readonly payoutIntents: ReadonlyMap<UUID, PayoutIntentModel>
}

export interface PayoutTransactionConverter extends BasicTransactionConverter<
  PayoutTransactionContext,
  TransactionConverterResult<PayoutTransactionContext>
> {
  readonly priority: PayoutPriority
}
