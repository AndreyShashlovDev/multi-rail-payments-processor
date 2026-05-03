import { IsArray } from 'class-validator'
import { BalanceUpdatedEvent, BalanceUpdatedDataEvent } from './balance-updated.event'
import { IntegrationAccount, UUID, Numeric } from '@app/types'

export type BalanceApplyError =
  | {
      code: 'INSUFFICIENT_FUNDS'
      integrationAccount: IntegrationAccount | null
      platformAccountId: UUID | null
      available: Numeric
      required: Numeric
    }
  | { code: 'PROJECTION_NOT_FOUND'; integrationAccount: IntegrationAccount | null; platformAccountId: UUID | null }

export class BalanceFailedEvent extends BalanceUpdatedEvent {
  static readonly EVENT_NAME: string = 'ledger:balance.failed'

  // todo additional checks
  @IsArray()
  readonly error: ReadonlyArray<BalanceApplyError>

  constructor(
    uniqueKey: string,
    changes: ReadonlyArray<BalanceUpdatedDataEvent>,
    error: ReadonlyArray<BalanceApplyError>,
  ) {
    super(uniqueKey, changes)
    this.error = error
  }
}
