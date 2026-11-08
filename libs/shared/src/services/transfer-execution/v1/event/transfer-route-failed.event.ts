import { BasicEvent, Id } from '@app/types'
import { IsString, IsNumberString } from 'class-validator'

// Executor → orchestrator: the step failed before any transaction exists
// (build error, relayer has no gas, RPC unavailable). On-chain failures come as TRANSACTION FAILED/REJECTED.
export class TransferRouteFailedEvent extends BasicEvent {
  static readonly EVENT_NAME = 'integrations:transfer-route.failed'

  @IsNumberString({ no_symbols: true })
  readonly transferRouteId: Id

  @IsString()
  readonly reason: string

  constructor(transferRouteId: Id, reason: string) {
    super(`transfer-route:failed:${transferRouteId}`, 1)

    this.transferRouteId = transferRouteId
    this.reason = reason
  }
}
