import { UUID, Id } from '@app/types'
import { IntentType } from '@app/shared'

export class TransferIntentModel {
  readonly id: Id
  readonly intentType: IntentType
  readonly intentId: UUID | Id
}
