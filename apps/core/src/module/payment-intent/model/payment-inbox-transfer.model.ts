import { Id, IntegrationAccount, IntegrationCurrency } from '@app/types'
import { TransactionStatus, IntegrationType, ExecutionType } from '@app/shared'
import type { TransactionModel } from '../../../shared/model/transaction.model'
import { PostgresAdvisoryLock } from '@app/database'

export enum PaymentInboxTransferStatus {
  CREATED = 'CREATED',
  BLOCKED = 'BLOCKED',
}

const TRANSFER_ID_BRAND = Symbol('TransferId')
export type PaymentInboxTransferKey = `${string}${string}:${string}:${string}` & { readonly [TRANSFER_ID_BRAND]: true }

export const PaymentInboxTransferKey = {
  create(
    executionType: ExecutionType,
    integration: IntegrationType,
    to: IntegrationAccount,
    currency: IntegrationCurrency,
  ): PaymentInboxTransferKey {
    return `${PostgresAdvisoryLock.CORE_PAYMENT_INBOX.name}:${executionType}:${integration}:${to}:${currency}` as PaymentInboxTransferKey
  },
}

export interface PaymentInboxTransferData {
  readonly txId: Id
  readonly transferId: Id
  readonly integration: IntegrationType
  readonly to: IntegrationAccount
  readonly currency: IntegrationCurrency
  readonly txStatus: TransactionStatus
  readonly data: TransactionModel
}

export interface PaymentInboxTransferModel extends PaymentInboxTransferData {
  readonly id: Id
  readonly key: PaymentInboxTransferKey
  readonly status: PaymentInboxTransferStatus
  readonly createdAt: Date
  readonly updatedAt: Date
}
