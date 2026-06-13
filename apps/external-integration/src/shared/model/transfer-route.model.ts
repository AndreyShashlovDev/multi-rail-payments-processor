import { Id, IntegrationAccount, IntegrationCurrency, Numeric, UUID } from '@app/types'
import { ExecutionType, IntegrationType } from '@app/shared'

export enum TransferRouteStatus {
  CREATED = 'CREATED', // создан, ждёт холда
  PENDING_HOLD = 'PENDING_HOLD',
  HELD = 'HELD', // подтвердили что средства залочили для обмена
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export interface TransferRouteData {
  readonly transactionIntentId: Id | null
  readonly transferIntentId: Id
  readonly txId: Id | null
  readonly intentId: UUID | Id
  readonly txIndex: number
  readonly executionType: ExecutionType
  readonly integration: IntegrationType
  readonly initiator: IntegrationAccount
  readonly fromAccount: IntegrationAccount
  readonly toAccount: IntegrationAccount
  readonly rawAmount: Numeric
  readonly currency: IntegrationCurrency
  readonly status: TransferRouteStatus
}

export interface TransferRouteModel extends TransferRouteData {
  readonly id: Id
  readonly createdAt: Date
  readonly updatedAt: Date
}
