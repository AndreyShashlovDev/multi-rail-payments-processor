import { Id, UUID, IntegrationAccount, Numeric, IntegrationCurrency } from '@app/types'
import { IntegrationType, IntentType } from '@app/shared'
import { BalanceChangeMetadata } from '@app/shared/types/balance-change'

export enum EscrowStatus {
  CREATED = 'CREATED',
  PREPARED = 'PREPARED',
  PROCESSED = 'PROCESSED',
  RESOLVED = 'RESOLVED',
}

export enum EscrowType {
  PLATFORM_FEE_ACCRUED = 'PLATFORM_FEE_ACCRUED',
  OVERPAY = 'OVERPAY',
  UNDERPAY = 'UNDERPAY',
  UNEXPECTED_PAYMENT = 'UNEXPECTED_PAYMENT',
  AMOUNT = 'AMOUNT',
  FEE = 'FEE',
  INTEGRATION_FEE = 'INTEGRATION_FEE',
}

export interface EscrowData {
  readonly integration: IntegrationType
  readonly platformAccountId: UUID | null
  readonly integrationAccount: IntegrationAccount | null
  readonly amount: Numeric
  readonly currency: IntegrationCurrency
  readonly type: EscrowType
  readonly intentType: IntentType | null
  readonly intentId: UUID | Id | null
  readonly status: EscrowStatus
  readonly metadata: Omit<BalanceChangeMetadata, 'intentType' | 'intentId'> | null
  readonly metadataHash: string
}

export interface EscrowModel extends EscrowData {
  readonly id: Id
  readonly createdAt: Date
  readonly updatedAt: Date
}
