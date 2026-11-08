import { BasicEvent, Id } from '@app/types'
import { IsNumberString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { TransferRouteResultBase, TRANSFER_ROUTE_RESULT_SUBTYPES } from './transfer-route-result'
import type { TransferRouteResult } from './transfer-route-result'

// Executor → orchestrator: the step transaction is confirmed. Carries the step result,
// so completion and result arrive together and the next step can be resolved from it.
export class TransferRouteCompletedEvent extends BasicEvent {
  static readonly EVENT_NAME = 'integrations:transfer-route.completed'

  @IsNumberString({ no_symbols: true })
  readonly transferRouteId: Id

  @IsNumberString({ no_symbols: true })
  readonly txId: Id

  @ValidateNested()
  @Type(() => TransferRouteResultBase, {
    discriminator: TRANSFER_ROUTE_RESULT_SUBTYPES,
    keepDiscriminatorProperty: true,
  })
  readonly result: TransferRouteResult

  constructor(transferRouteId: Id, txId: Id, result: TransferRouteResult) {
    super(`transfer-route:completed:${transferRouteId}`, 1)

    this.transferRouteId = transferRouteId
    this.txId = txId
    this.result = result
  }
}
