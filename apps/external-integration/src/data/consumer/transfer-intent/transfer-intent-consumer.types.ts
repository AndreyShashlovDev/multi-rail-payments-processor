import { TransferIntentHeldEventModel } from '../../../module/transfer-intent/model/transfer-intent-held-event.model'
import { TransferIntentCreateEventModel } from '../../../module/transfer-intent/model/transfer-intent.create-event.model'

export type TransferIntentEventModelType = {
  readonly create: TransferIntentCreateEventModel
  readonly held: TransferIntentHeldEventModel
}

export type TransferIntentEventKeyType = keyof TransferIntentEventModelType

export type TransferIntentEventModel<T extends TransferIntentEventKeyType> = TransferIntentEventModelType[T]
