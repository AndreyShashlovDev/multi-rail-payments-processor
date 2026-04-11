import { UUID } from '@app/types'
import { TransactionContext } from '../../../../shared/projection/transaction-converter.engine'
import { PayoutIntentModel } from '../../model/payout-intent.model'
import { PayoutPriority } from '../converter-priority.constants'
import {
  BasicTransactionConverter,
  TransactionConverterResult,
} from '../../../../shared/projection/basic-transaction.converter'

export interface PayoutTransactionContext extends TransactionContext {
  readonly payoutIntents: ReadonlyMap<UUID, PayoutIntentModel>
}

export interface PayoutTransactionConverter extends BasicTransactionConverter<
  PayoutTransactionContext,
  TransactionConverterResult<PayoutTransactionContext>
> {
  readonly priority: PayoutPriority
}
