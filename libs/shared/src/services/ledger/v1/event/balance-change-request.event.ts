import {
  ValidateNested,
  IsArray,
  IsEnum,
  IsUUID,
  IsOptional,
  IsString,
  IsObject,
  IsNotEmptyObject,
  IsNumberString,
} from 'class-validator'
import { BasicEvent, UUID, IntegrationAccount, type IntegrationCurrency, type RawNumeric, Id } from '@app/types'
import { Type } from 'class-transformer'
import { BalanceChangeType, IntegrationType, IntentType } from '@app/shared/types'
import type { BalanceChangeDataMetadata } from '@app/shared/services/ledger/v1/event/balance-change-metadata.type'
import { BalanceChangeOperationType } from '@app/shared/types/balance-change'

export class BalanceChangeRequestData {
  @IsEnum(BalanceChangeType)
  readonly type: BalanceChangeType

  @IsEnum(IntentType)
  @IsOptional()
  readonly intentType: IntentType | null

  @IsUUID()
  @IsOptional()
  readonly intentId: Id | UUID | null

  @IsEnum(BalanceChangeOperationType)
  @IsOptional()
  readonly operationType: BalanceChangeOperationType | null

  @IsUUID()
  @IsOptional()
  readonly platformAccountId: UUID | null

  @IsString() // specific validator for all types of accounts
  @IsOptional()
  readonly integrationAccount: IntegrationAccount | null

  @IsString() // specific validator for all types of accounts
  readonly currency: IntegrationCurrency

  @IsNumberString()
  readonly amount: RawNumeric

  @IsObject()
  @IsNotEmptyObject()
  readonly metadata: BalanceChangeDataMetadata

  constructor(
    type: BalanceChangeType,
    intentType: IntentType | null,
    intentId: Id | UUID | null,
    operationType: BalanceChangeOperationType | null,
    platformAccountId: UUID | null,
    integrationAccount: IntegrationAccount | null,
    currency: IntegrationCurrency,
    amount: RawNumeric,
    metadata: BalanceChangeDataMetadata,
  ) {
    this.type = type
    this.intentType = intentType
    this.intentId = intentId
    this.operationType = operationType
    this.platformAccountId = platformAccountId
    this.integrationAccount = integrationAccount
    this.currency = currency
    this.amount = amount
    this.metadata = metadata
  }
}

export class BalanceChangeRequestEvent extends BasicEvent {
  static readonly EVENT_NAME = 'ledger:balance.change-request'

  @IsEnum(IntegrationType)
  readonly integration: IntegrationType

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BalanceChangeRequestData)
  readonly changes: ReadonlyArray<BalanceChangeRequestData>

  constructor(uniqueKey: string, integration: IntegrationType, changes: ReadonlyArray<BalanceChangeRequestData>) {
    // todo signature!
    super(uniqueKey, 1)

    this.integration = integration
    this.changes = changes
  }
}
