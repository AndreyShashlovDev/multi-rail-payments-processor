import type { Id } from '@app/types'

export interface MarkAsPreparedParams {
  readonly ids: ReadonlySet<Id>
}

export interface MarkAsProcessingParams {
  readonly ids: ReadonlySet<Id>
}
