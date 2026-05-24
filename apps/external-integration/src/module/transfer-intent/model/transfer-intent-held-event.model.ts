import { IntentType } from '@app/shared'
import { UUID, Id } from '@app/types'

export interface TransferIntentHeldEventData {
  readonly intentId: UUID
  readonly txId: Id
}

export interface TransferIntentHeldEventModel {
  readonly uniqueKey: string
  readonly intentType: IntentType
  readonly intentData: ReadonlyArray<TransferIntentHeldEventData>
}
