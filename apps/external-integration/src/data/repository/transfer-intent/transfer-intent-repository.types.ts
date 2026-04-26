import { IntentType } from '@app/shared'
import type { UUID, Id } from '@app/types'

export interface MarkAsPreparedParams {
  readonly intentType: IntentType
  readonly intentIds: ReadonlySet<UUID>
}

export interface MarkAsProcessingParams {
  readonly transactionIntentId: Id
}
