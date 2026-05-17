import {
  type IntegrationAccount,
  type RawNumeric,
  type IntegrationCurrency,
  type Iso8601StringDate,
  BasicEvent,
} from '@app/types'
import { IntegrationType } from '@app/shared/types'
import { IsISO8601, IsArray, ValidateNested, IsEnum, IsNumberString, IsString } from 'class-validator'
import { Type } from 'class-transformer'

export class ProjectionEventData {
  @IsString()
  readonly account: IntegrationAccount

  @IsEnum(IntegrationType)
  readonly integration: IntegrationType

  @IsString()
  readonly currency: IntegrationCurrency

  @IsNumberString()
  readonly amount: RawNumeric

  constructor(
    account: IntegrationAccount,
    integration: IntegrationType,
    currency: IntegrationCurrency,
    amount: RawNumeric,
  ) {
    this.account = account
    this.integration = integration
    this.currency = currency
    this.amount = amount
  }
}

export class BalanceProjectionUpdatedEvent extends BasicEvent {
  static readonly EVENT_NAME: string = 'ledger:balance-projection.updated'

  @ValidateNested({ each: true })
  @Type(() => ProjectionEventData)
  @IsArray()
  readonly projections: ReadonlyArray<ProjectionEventData>

  @IsISO8601()
  readonly date: Iso8601StringDate

  constructor(uniqueKey: string, projections: ReadonlyArray<ProjectionEventData>, date: Iso8601StringDate) {
    super(uniqueKey, 1)
    this.projections = projections
    this.date = date
  }
}
