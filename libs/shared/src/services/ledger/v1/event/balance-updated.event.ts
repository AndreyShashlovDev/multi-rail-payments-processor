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
import { BalanceChangeType, IntegrationType } from '@app/shared/types'
import { UUID, IntegrationAccount, type IntegrationCurrency, BasicEvent, type RawNumeric } from '@app/types'
import { Type } from 'class-transformer'
import type { BalanceChangeDataMetadata } from '@app/shared/services/ledger/v1/event/balance-change-metadata.type'

export class BalanceUpdatedData {
  @IsEnum(BalanceChangeType)
  readonly type: BalanceChangeType

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
    integration: IntegrationType,
    platformAccountId: UUID | null,
    integrationAccount: IntegrationAccount | null,
    currency: IntegrationCurrency,
    amount: string,
    metadata: BalanceChangeDataMetadata,
  ) {
    this.type = type
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
