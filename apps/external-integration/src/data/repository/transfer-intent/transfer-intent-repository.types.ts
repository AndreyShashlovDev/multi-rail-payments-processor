import { TransferIntentHeldEventModel } from '../../../module/transfer-intent/model/transfer-intent-held-event.model'
import {
  TransferIntentCreateEventModel,
} from '../../../module/transfer-intent/model/transfer-intent.create-event.model'
import { IntentType } from '@app/shared'
import type { UUID, Id } from '@app/types'

export type TransferIntentEventModelType = {
  readonly create: TransferIntentCreateEventModel
  readonly held: TransferIntentHeldEventModel
}

export type TransferIntentEventKeyType = keyof TransferIntentEventModelType

export type TransferIntentEventModel<T extends TransferIntentEventKeyType> = TransferIntentEventModelType[T]

export interface MarkAsPreparedParams {
  readonly intentType: IntentType
  readonly intentIds: ReadonlySet<UUID>
}

export interface MarkAsProcessingParams {
  readonly transactionIntentId: Id
}
