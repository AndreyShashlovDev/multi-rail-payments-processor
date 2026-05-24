import { SourceTransactionId, Id, RawNumeric, IntegrationCurrency, IntegrationAccount } from '@app/types'
import { IntegrationType, ExecutionType } from '@app/shared'

export enum TransactionIntentStatus {
  HOLD_PENDING = 'HOLD_PENDING',
  READY_FOR_SIGNING = 'READY_FOR_SIGNING',
  SIGNING = 'SIGNING',
  READY_TO_PROMOTE = 'READY_TO_PROMOTE',
  PROMOTED = 'PROMOTED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
}

export interface EvmTransaction {
  readonly hash: SourceTransactionId
  readonly nonce: number
  readonly from: IntegrationAccount
  readonly to: IntegrationAccount
  readonly data: `0x${string}` | null
}

export type TransactionIntentMetadata = EvmTransaction

export interface TransactionIntentData {
  readonly executionType: ExecutionType
  readonly initiator: IntegrationAccount
  readonly sourceTxId: SourceTransactionId
  readonly integration: IntegrationType
  readonly fee: RawNumeric | null
  readonly feeCurrency: IntegrationCurrency
  readonly rawData: TransactionIntentMetadata
}

export interface TransactionIntentModel extends TransactionIntentData {
  readonly id: Id
  readonly status: TransactionIntentStatus
  readonly signedData: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
}
