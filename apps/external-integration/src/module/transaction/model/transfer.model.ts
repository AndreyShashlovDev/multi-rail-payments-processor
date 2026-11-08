import { IntegrationAccount, Id, IntegrationCurrency, RawNumeric, UUID } from '@app/types'
import { IntegrationType, IntentType } from '@app/shared'

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
  readonly transferRouteId: Id | null
  readonly intentType: IntentType | null
  readonly intentId: UUID | Id | null
  readonly metadata: TransferMetadata | null
}

export interface TransferModel extends TransferData {
  readonly id: Id
  readonly transactionId: Id
  readonly createdAt: Date
}
