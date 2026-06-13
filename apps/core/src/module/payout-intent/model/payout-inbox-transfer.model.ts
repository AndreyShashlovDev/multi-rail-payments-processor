import { Id, UUID } from '@app/types'
import { TransactionStatus, IntegrationType, ExecutionType } from '@app/shared'
import type { TransactionModel } from '../../../shared/model/transaction.model'
import { PostgresAdvisoryLock } from '@app/database'

export enum PayoutInboxTransferStatus {
  CREATED = 'CREATED',
  BLOCKED = 'BLOCKED',
}

const TRANSFER_ID_BRAND = Symbol('TransferId')
export type PayoutInboxTransferKey = `${string}${string}:${string}` & { readonly [TRANSFER_ID_BRAND]: true }

export const PayoutInboxTransferKey = {
  create(executionType: ExecutionType, intentId: UUID): PayoutInboxTransferKey {
    return `${PostgresAdvisoryLock.CORE_PAYOUT_INBOX.name}${executionType}:${intentId}` as PayoutInboxTransferKey
  },
}

export interface PayoutInboxTransferData {
  readonly txId: Id
  readonly transferId: Id
  readonly integration: IntegrationType
  readonly intentId: UUID
  readonly txStatus: TransactionStatus
  readonly data: TransactionModel
}

export interface PayoutInboxTransferModel extends PayoutInboxTransferData {
  readonly id: Id
  readonly key: PayoutInboxTransferKey
  readonly status: PayoutInboxTransferStatus
  readonly createdAt: Date
  readonly updatedAt: Date
}
