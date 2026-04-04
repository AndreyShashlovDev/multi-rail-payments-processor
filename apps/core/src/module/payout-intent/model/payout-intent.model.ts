import { UUID, Numeric, type IntegrationCurrency } from '@app/types'
import { IntegrationType } from '@app/shared'
import { PlatformMemberModel } from '../../../shared/model/platform-member.model'
import {
  DestinationIntegrationAccount,
  SourceIntegrationAccount,
} from '../../../shared/model/composite-integration-account.model'

export enum PayoutIntentStatus {
  CREATED = 'CREATED',
  PREPARED = 'PREPARED',
  HELD = 'HELD',
  PROCESSING = 'PROCESSING',
  CONFIRMING = 'CONFIRMING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum PayoutOperationType {
  USER_REQUEST = 'USER_REQUEST',
  CONSOLIDATION = 'CONSOLIDATION', // for example, top-up etc.
}

export type PayoutIntentMetadataType = Record<string, unknown>

export interface PayoutIntentData {
  readonly operationType: PayoutOperationType

  readonly member: PlatformMemberModel

  readonly from: SourceIntegrationAccount
  readonly fromAmount: Numeric
  readonly fromCurrency: IntegrationCurrency
  readonly fromIntegration: IntegrationType

  readonly estimatedFee: Numeric
  readonly estimatedFeeCurrency: IntegrationCurrency

  // platform commission in the same currency as the underlying transfer
  readonly platformFee: Numeric | null
  // where the platform's fee is credited
  readonly platformFeeAccount: SourceIntegrationAccount | null

  // the person who actually paid for the transfer. (Could be a system wallet) null because it's filled in later
  readonly integrationFeePayer: DestinationIntegrationAccount | null

  readonly integrationFee: Numeric | null
  readonly integrationFeeCurrency: IntegrationCurrency
  readonly integrationFeeRate: Numeric

  readonly exchangeRate: Numeric | null

  readonly to: DestinationIntegrationAccount
  readonly toAmount: Numeric
  readonly toCurrency: IntegrationCurrency
  readonly toIntegration: IntegrationType

  readonly status: PayoutIntentStatus
  readonly metadata: PayoutIntentMetadataType | null
}

export interface PayoutIntentModel extends PayoutIntentData {
  readonly id: UUID
  readonly createdAt: Date
  readonly updatedAt: Date
}
