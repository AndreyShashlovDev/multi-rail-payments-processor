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
import { BasicEvent, UUID, IntegrationAccount, type IntegrationCurrency, type RawNumeric } from '@app/types'
import { Type } from 'class-transformer'
import { BalanceChangeType, IntegrationType } from '@app/shared/types'
import type { BalanceChangeDataMetadata } from '@app/shared/services/ledger/v1/event/balance-change-metadata.type'

export class BalanceChangeRequestData {
  @IsEnum(BalanceChangeType)
  readonly type: BalanceChangeType

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
    platformAccountId: UUID | null,
    integrationAccount: IntegrationAccount | null,
    currency: IntegrationCurrency,
    amount: RawNumeric,
    metadata: BalanceChangeDataMetadata,
  ) {
    this.type = type
    this.platformAccountId = platformAccountId
    this.integrationAccount = integrationAccount
    this.currency = currency
    this.amount = amount
    this.metadata = metadata
  }
}

export class BalanceChangeRequestEvent extends BasicEvent {
  @IsEnum(IntegrationType)
  readonly integration: IntegrationType

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BalanceChangeRequestData)
  readonly changes: ReadonlyArray<BalanceChangeRequestData>

  constructor(uniqueKey: string, integration: IntegrationType, changes: ReadonlyArray<BalanceChangeRequestData>) {
    // todo signature!
    super(uniqueKey, 1, null)

    this.integration = integration
    this.changes = changes
  }
}
