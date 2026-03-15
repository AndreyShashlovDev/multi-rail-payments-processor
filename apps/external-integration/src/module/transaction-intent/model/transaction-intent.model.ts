import { TransferIntentModel } from '../../transfer-intent/model/transfer-intent.model'
import type { SourceTransactionId, Id } from '@app/types'
import { IntegrationType } from '@app/shared'
import { EvmTransaction } from '../../transaction/integration/blockchain/transaction-builder/evm-single-transfer.builder'

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

export type TransactionIntentMetadata = EvmTransaction

export interface TransactionIntentData {
  readonly txId: SourceTransactionId
  readonly integration: IntegrationType
  readonly status: TransactionIntentStatus
  readonly nonce: number
  readonly rawData: TransactionIntentMetadata
  readonly signedData: string | null
  readonly transfers: ReadonlyArray<TransferIntentModel>
}

export interface TransactionIntentModel extends TransactionIntentData {
  readonly id: Id
  readonly createdAt: Date
  readonly updatedAt: Date
}
