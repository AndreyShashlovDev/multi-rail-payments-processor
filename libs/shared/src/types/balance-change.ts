import { IntegrationAccount } from '@app/types/integration-account'
import { Numeric } from '@app/types/numeric.type'
import { Id } from '@app/types/id.type'
import { UUID, IntegrationCurrency } from '@app/types'
import { IntegrationType, IntentType, BalanceChangeType } from '@app/shared/index'

export enum BalanceChangeTxStatus {
  TX_PREPARED = 'TX_PREPARED',
  TX_CONFIRMED = 'TX_CONFIRMED',
  TX_ACCEPTED = 'TX_ACCEPTED',
}

export enum BalanceChangeOperationType {
  USER_REQUEST = 'USER_REQUEST',
  CONSOLIDATION = 'CONSOLIDATION',
}

export enum BalanceChangeReason {
  // Payment reasons
  OVERPAY = 'OVERPAY',
  UNDERPAY = 'UNDERPAY',
  UNEXPECTED_PAYMENT = 'UNEXPECTED_PAYMENT',
  FEE = 'FEE',
  INTEGRATION_FEE = 'INTEGRATION_FEE',
  PLATFORM_FEE_CONSOLIDATION = 'PLATFORM_FEE_CONSOLIDATION',
  AMOUNT = 'AMOUNT',

  // just for example...
  // Payout reasons
  TRANSACTION_REVERTED = 'TRANSACTION_REVERTED',
  MEMPOOL_REJECTED = 'MEMPOOL_REJECTED',
  CEX_REJECTED = 'CEX_REJECTED',
  SEND_FAILED = 'SEND_FAILED',
  TIMEOUT = 'TIMEOUT',

  // System reasons
  BLOCKCHAIN_REORG = 'BLOCKCHAIN_REORG',
  FORK_DETECTED = 'FORK_DETECTED',
  MANUAL_CORRECTION = 'MANUAL_CORRECTION',
  SYSTEM_ERROR_CORRECTION = 'SYSTEM_ERROR_CORRECTION',
  FEE_ADJUSTMENT = 'FEE_ADJUSTMENT',
}

export interface BalanceChangeMetadata {
  readonly txId?: Id
  readonly reason?: BalanceChangeReason
  readonly txStatus?: BalanceChangeTxStatus
  readonly transferIds?: ReadonlyArray<Id>

  // payment
  readonly overpay?: Numeric
  readonly actualAmount?: Numeric
  readonly expectedAmount?: Numeric

  readonly relatedIntentType?: IntentType | null
  readonly relatedIntentId?: UUID | Id

  // payout
  readonly integrationFeeDiff?: Numeric
}

export interface BalanceChange<T extends BalanceChangeMetadata = BalanceChangeMetadata> {
  readonly type: BalanceChangeType
  readonly intentType: IntentType | null
  readonly intentId: Id | UUID | null
  readonly operationType: BalanceChangeOperationType | null
  readonly platformAccountId: UUID | null
  readonly integrationAccount: IntegrationAccount | null
  readonly currency: IntegrationCurrency
  readonly integration: IntegrationType
  readonly amount: Numeric
  readonly metadata: T
}
