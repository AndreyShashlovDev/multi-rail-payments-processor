import { TransferIntentCreateEvent } from '@app/shared/services/external-integration/v1'
import { TransferIntentHeldEvent } from '@app/shared/services/external-integration/v1/event/transfer-intent-held.event'

export type TransferIntentEventType = {
  readonly create: TransferIntentCreateEvent
  readonly held: TransferIntentHeldEvent
}

export type TransferIntentEventKeyType = keyof TransferIntentEventType

export type TransferIntentEvent<T extends TransferIntentEventKeyType> = TransferIntentEventType[T]
