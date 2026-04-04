import {
  IsEnum,
  IsUUID,
  IsOptional,
  IsString,
  IsNumberString,
  IsObject,
  IsNotEmptyObject,
  IsArray,
  ValidateNested,
} from 'class-validator'
import { BalanceChangeType, IntegrationType, IntentType } from '@app/shared/types'
import { UUID, IntegrationAccount, type IntegrationCurrency, BasicEvent, type RawNumeric, Id } from '@app/types'
import { Type } from 'class-transformer'
import type { BalanceChangeDataMetadata } from '@app/shared/services/ledger/v1/event/balance-change-metadata.type'
import { BalanceChangeOperationType } from '@app/shared/types/balance-change'

export class BalanceUpdatedData {
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

  @IsEnum(IntegrationType)
  readonly integration: IntegrationType

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
    integration: IntegrationType,
    platformAccountId: UUID | null,
    integrationAccount: IntegrationAccount | null,
    currency: IntegrationCurrency,
    amount: string,
    metadata: BalanceChangeDataMetadata,
  ) {
    this.type = type
    this.intentType = intentType
    this.intentId = intentId
    this.operationType = operationType
    this.integration = integration
    this.platformAccountId = platformAccountId
    this.integrationAccount = integrationAccount
    this.currency = currency
    this.amount = amount
    this.metadata = metadata
  }
}

export class BalanceUpdatedEvent extends BasicEvent {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BalanceUpdatedData)
  readonly changes: ReadonlyArray<BalanceUpdatedData>

  constructor(uniqueKey: string, changes: ReadonlyArray<BalanceUpdatedData>) {
    // todo signature!
    super(uniqueKey, 1, null)
    this.changes = changes
  }
}
