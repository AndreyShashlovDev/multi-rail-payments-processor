import { IntentType } from '@app/shared'
import type { UUID } from '@app/types'

export interface TransferIntentHeldEventModel {
  readonly intentType: IntentType
  readonly intentIds: ReadonlySet<UUID>
}
