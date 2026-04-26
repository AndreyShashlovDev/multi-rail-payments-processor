import { IntentType } from '@app/shared/types'
import { UUID, BasicEvent } from '@app/types'
import { IsUUID, IsEnum, IsArray } from 'class-validator'

export class TransferIntentHeldEvent extends BasicEvent {
  static readonly EVENT_NAME = 'integrations:transfer-intent.held'

  @IsEnum(IntentType)
  readonly intentType: IntentType

  @IsUUID(undefined, { each: true })
  @IsArray()
  readonly intentIds: ReadonlyArray<UUID>

  constructor(uniqueKey: string, intentType: IntentType, intentIds: ReadonlyArray<UUID>) {
    // todo signature!
    super(uniqueKey, 1, null)

    this.intentType = intentType
    this.intentIds = intentIds
  }
}
