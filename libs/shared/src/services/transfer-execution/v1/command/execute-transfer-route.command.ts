import { BasicEvent, Id, type IntegrationAccount, type IntegrationCurrency, type RawNumeric } from '@app/types'
import { IsString, IsEnum, IsNumberString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { IntegrationType, ExecutionType } from '@app/shared/types'
import { TransferEventIntentData } from '@app/shared/services/external-integration/v1'

// Orchestrator → executor: build and execute the transaction of a single step (transfer route).
// `intent` is opaque for the executor: it is stored with the transfer and echoed back in TRANSACTION events.
export class ExecuteTransferRouteCommand extends BasicEvent {
  static readonly EVENT_NAME = 'integrations:transfer-route.execute'

  @IsNumberString({ no_symbols: true })
  readonly transferRouteId: Id

  @IsEnum(IntegrationType)
  readonly integration: IntegrationType

  @IsEnum(ExecutionType)
  readonly executionType: ExecutionType

  @IsString() // todo some smart validator
  readonly initiator: IntegrationAccount

  @IsString() // todo some smart validator
  readonly from: IntegrationAccount

  @IsString() // todo some smart validator
  readonly to: IntegrationAccount

  @IsString()
  readonly currency: IntegrationCurrency

  @IsNumberString()
  readonly rawAmount: RawNumeric

  @ValidateNested()
  @Type(() => TransferEventIntentData)
  readonly intent: TransferEventIntentData

  constructor(
    transferRouteId: Id,
    integration: IntegrationType,
    executionType: ExecutionType,
    initiator: IntegrationAccount,
    from: IntegrationAccount,
    to: IntegrationAccount,
    currency: IntegrationCurrency,
    rawAmount: RawNumeric,
    intent: TransferEventIntentData,
  ) {
    super(`transfer-route:execute:${transferRouteId}`, 1)

    this.transferRouteId = transferRouteId
    this.integration = integration
    this.executionType = executionType
    this.initiator = initiator
    this.from = from
    this.to = to
    this.currency = currency
    this.rawAmount = rawAmount
    this.intent = intent
  }
}
