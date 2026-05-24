import { IntentType } from '@app/shared/types'
import { type UUID, BasicEvent, Id } from '@app/types'
import { IsUUID, IsEnum, ValidateNested, IsString } from 'class-validator'
import { Type } from 'class-transformer'

export class IntentDataEntry {
  @IsUUID()
  readonly intentId: UUID

  @IsString()
  readonly txId: Id

  constructor(intentId: UUID, txId: Id) {
    this.intentId = intentId
    this.txId = txId
  }
}

export class TransferIntentHeldEvent extends BasicEvent {
  static readonly EVENT_NAME = 'integrations:transfer-intent.held'

  @IsEnum(IntentType)
  readonly intentType: IntentType

  @ValidateNested({ each: true })
  @Type(() => IntentDataEntry)
  readonly intentData: ReadonlyArray<IntentDataEntry>

  constructor(uniqueKey: string, intentType: IntentType, intentData: ReadonlyArray<IntentDataEntry>) {
    super(uniqueKey, 1)

    this.intentType = intentType
    this.intentData = intentData
  }
}
