import { IntentType, IntegrationType } from '@app/shared/types'
import { type UUID, type IntegrationCurrency, type IntegrationAccount, BasicEvent } from '@app/types'
import { IsUUID, IsEnum, IsNumberString, IsString } from 'class-validator'

export class TransferIntentCreateEvent extends BasicEvent {
  static readonly EVENT_NAME = 'integrations:transfer-intent.create'

  @IsUUID()
  readonly intentId: UUID

  @IsEnum(IntentType)
  readonly intentType: IntentType

  @IsNumberString()
  readonly estimatedRawFee: string

  @IsString()
  readonly feeCurrency: IntegrationCurrency

  @IsNumberString()
  readonly fromAmount: string

  @IsEnum(IntegrationType)
  readonly fromIntegration: IntegrationType

  @IsString()
  readonly fromCurrency: IntegrationCurrency

  @IsString()
  readonly from: IntegrationAccount

  @IsNumberString()
  readonly toAmount: string

  @IsEnum(IntegrationType)
  readonly toIntegration: IntegrationType

  @IsString()
  readonly toCurrency: IntegrationCurrency

  @IsString()
  readonly to: IntegrationAccount

  constructor(
    uniqueKey: string,
    intentId: UUID,
    intentType: IntentType,
    estimatedRawFee: string,
    feeCurrency: IntegrationCurrency,
    fromAmount: string,
    fromIntegration: IntegrationType,
    fromCurrency: IntegrationCurrency,
    from: IntegrationAccount,
    toAmount: string,
    toIntegration: IntegrationType,
    toCurrency: IntegrationCurrency,
    to: IntegrationAccount,
  ) {
    // todo signature!
    super(uniqueKey, 1, null)

    this.intentId = intentId
    this.intentType = intentType
    this.estimatedRawFee = estimatedRawFee
    this.feeCurrency = feeCurrency
    this.fromAmount = fromAmount
    this.fromIntegration = fromIntegration
    this.fromCurrency = fromCurrency
    this.from = from
    this.toAmount = toAmount
    this.toIntegration = toIntegration
    this.toCurrency = toCurrency
    this.to = to
  }
}
