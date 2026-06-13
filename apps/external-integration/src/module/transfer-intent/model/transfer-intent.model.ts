import type { UUID, IntegrationCurrency, IntegrationAccount, Id, RawNumeric } from '@app/types'
import { IntentType, IntegrationType } from '@app/shared'

export enum TransferIntentStatus {
  CREATED = 'CREATED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
}

export interface TransferIntentData {
  readonly intentId: UUID | Id
  readonly intentType: IntentType
  readonly estimatedRawFee: RawNumeric
  readonly feeCurrency: IntegrationCurrency
  readonly fromRawAmount: RawNumeric
  readonly fromIntegration: IntegrationType
  readonly fromCurrency: IntegrationCurrency
  readonly fromAccount: IntegrationAccount
  readonly toRawAmount: RawNumeric
  readonly toIntegration: IntegrationType
  readonly toCurrency: IntegrationCurrency
  readonly toAccount: IntegrationAccount
}

export interface TransferIntentModel extends TransferIntentData {
  readonly id: Id
  readonly depositId: string | null
  readonly status: TransferIntentStatus
  readonly createdAt: Date
  readonly updatedAt: Date
}
