import { TransactionModel } from '../../../module/transaction/model/transaction.model'
import { Id, UUID } from '@app/types'
import { IntentType } from '@app/shared'
import { TransferModel } from '../../../module/transaction/model/transfer.model'

export interface TransferEventIntent {
  readonly id: Id
  readonly intentType: IntentType
  readonly intentId: UUID | Id
}

export interface TransferEventWithIntent extends TransferModel {
  readonly intent: TransferEventIntent | null
}

export interface TransactionEventData extends Omit<TransactionModel, 'transfers'> {
  readonly transfers: ReadonlyArray<TransferEventWithIntent>
}
