import {
  BasicEvent,
  Id,
  type IntegrationAccount,
  type SourceTransactionId,
  type IntegrationCurrency,
  UUID,
} from '@app/types'
import {
  IsString,
  IsEnum,
  IsNumberString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsInt,
  IsISO8601,
} from 'class-validator'
import crypto from 'crypto'
import { Type } from 'class-transformer'
import { IntegrationType, TransactionStatus, IntentType, ExecutionType } from '@app/shared/types'

export class TransferEventIntentData {
  @IsNumberString({ no_symbols: true })
  readonly id: Id

  @IsEnum(IntentType)
  readonly intentType: IntentType

  @IsString()
  readonly intentId: UUID | Id

  constructor(id: Id, intentType: IntentType, intentId: UUID | Id) {
    this.id = id
    this.intentType = intentType
    this.intentId = intentId
  }
}

export class TransferEventData {
  @IsNumberString({ no_symbols: true })
  readonly id: Id

  @IsInt()
  readonly index: number

  @IsString() // todo some smart validator
  readonly initiator: IntegrationAccount

  @IsString() // todo some smart validator
  readonly from: IntegrationAccount

  @IsString() // todo some smart validator
  readonly to: IntegrationAccount

  @IsNumberString()
  readonly rawAmount: string

  @IsString()
  @IsOptional()
  readonly currency: IntegrationCurrency

  @ValidateNested()
  @Type(() => TransferEventIntentData)
  @IsOptional()
  readonly intent: TransferEventIntentData | null

  constructor(
    id: Id,
    index: number,
    initiator: IntegrationAccount,
    from: IntegrationAccount,
    to: IntegrationAccount,
    rawAmount: string,
    currency: IntegrationCurrency,
    intent: TransferEventIntentData | null,
  ) {
    this.id = id
    this.index = index
    this.initiator = initiator
    this.from = from
    this.to = to
    this.rawAmount = rawAmount
    this.currency = currency
    this.intent = intent
  }
}

export class TransactionEvent extends BasicEvent {
  static readonly EVENT_VER: number = 1
  static readonly EVENT_NAME = 'integrations:transaction'

  @IsNumberString({ no_symbols: true })
  readonly id: Id

  @IsEnum(ExecutionType)
  readonly executionType: ExecutionType

  @IsEnum(IntegrationType)
  readonly integration: IntegrationType

  @IsString()
  readonly initiator: IntegrationAccount

  @IsString() // todo special validator need
  readonly sourceTxId: SourceTransactionId

  @IsEnum(TransactionStatus)
  readonly status: TransactionStatus

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferEventData)
  readonly transfers: TransferEventData[]

  @IsNumberString()
  @IsOptional()
  readonly fee: string | null

  @IsString()
  readonly feeCurrency: IntegrationCurrency

  @IsISO8601()
  @IsOptional()
  readonly executedDate: string | null

  constructor(
    id: Id,
    executionType: ExecutionType,
    integration: IntegrationType,
    initiator: IntegrationAccount,
    sourceTxId: SourceTransactionId,
    status: TransactionStatus,
    transfers: TransferEventData[],
    fee: string | null,
    feeCurrency: IntegrationCurrency,
    executedDate: string | null,
  ) {
    super(TransactionEvent.createUniqueKey(integration, sourceTxId, status), TransactionEvent.EVENT_VER)

    this.id = id
    this.executionType = executionType
    this.integration = integration
    this.initiator = initiator
    this.sourceTxId = sourceTxId
    this.status = status
    this.transfers = transfers
    this.fee = fee
    this.feeCurrency = feeCurrency
    this.executedDate = executedDate
  }

  static createUniqueKey(
    integration: IntegrationType,
    sourceTxId: SourceTransactionId,
    status: TransactionStatus,
  ): string {
    const uniqueData = `${integration}:${sourceTxId}:${status}`
    return crypto.createHash('sha256').update(uniqueData).digest('base64').slice(0, 32)
  }
}
