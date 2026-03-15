import { IntegrationAccount, Id, IntegrationCurrency, RawNumeric } from '@app/types'
import { IntegrationType } from '@app/shared'

export enum OperationType {
  NATIVE_TRANSFER = 'NATIVE_TRANSFER',
  TOKEN_TRANSFER = 'TOKEN_TRANSFER',
  // 'swap', 'stake', etc...
}

export type TransferMetadata = Record<string, unknown>

export interface TransferData {
  readonly integration: IntegrationType
  readonly operation: OperationType
  readonly index: number
  readonly initiator: IntegrationAccount
  readonly from: IntegrationAccount
  readonly to: IntegrationAccount
  readonly fromOwner: IntegrationAccount
  readonly toOwner: IntegrationAccount
  readonly amountRaw: RawNumeric
  readonly currency: IntegrationCurrency
  readonly transferIntentId: Id | null
  readonly metadata: TransferMetadata | null
}

export interface TransferModel extends TransferData {
  readonly id: Id
  readonly transactionId: Id
  readonly createdAt: Date
}
