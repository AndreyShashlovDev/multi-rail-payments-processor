import { UUID, Numeric, IntegrationCurrency, IntegrationAccount } from '@app/types'
import { IntegrationType } from '@app/shared'
import { SourceIntegrationAccount } from '../../../shared/model/composite-integration-account.model'
import { PlatformMemberModel } from '../../../shared/model/platform-member.model'

export enum PaymentIntentStatus {
  CREATED = 'CREATED',
  CONFIRMING = 'CONFIRMING',
  UNDERPAY = 'UNDERPAY',
  OVERPAY = 'OVERPAY',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentPlatformFeePayerType {
  CLIENT = 'CLIENT',
  PAYER = 'PAYER',
}

export enum PaymentOperationType {
  USER_REQUEST = 'USER_REQUEST',
  CONSOLIDATION = 'CONSOLIDATION', // for example, top-up etc.
}

export interface PaymentIntentData {
  readonly operationType: PaymentOperationType
  readonly member: PlatformMemberModel
  readonly to: SourceIntegrationAccount
  readonly fromPlatformAccountId: UUID | null
  readonly fromIntegrationAccount: IntegrationAccount | null
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
  readonly amount: Numeric
  readonly paid: Numeric
  readonly platformFee: Numeric | null
  readonly platformFeeAccount: SourceIntegrationAccount | null
  readonly platformFeePayer: PaymentPlatformFeePayerType | null
  readonly status: PaymentIntentStatus
  readonly metadata: Record<string, unknown> | null
}

export interface PaymentIntentModel extends PaymentIntentData {
  readonly id: UUID
  readonly createdAt: Date
  readonly updatedAt: Date
}
