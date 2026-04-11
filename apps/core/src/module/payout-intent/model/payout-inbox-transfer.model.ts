import { Id, UUID } from '@app/types'
import { TransactionStatus, IntegrationType } from '@app/shared'
import type { TransactionModel } from '../../../shared/model/transaction.model'

export enum PayoutInboxTransferStatus {
  CREATED = 'CREATED',
  BLOCKED = 'BLOCKED',
}

const TRANSFER_ID_BRAND = Symbol('TransferId')
export type PayoutInboxTransferKey = `${string}:${string}` & { readonly [TRANSFER_ID_BRAND]: true }

export const PayoutInboxTransferKey = {
  create(integration: IntegrationType, intentId: UUID): PayoutInboxTransferKey {
    return `${integration}:${intentId}` as PayoutInboxTransferKey
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
