import { Id, IntegrationAccount, IntegrationCurrency, Numeric, UUID } from '@app/types'
import { ExecutionType, IntegrationType } from '@app/shared'
import type { TransferRouteResult } from '@app/shared/services/transfer-execution/v1'

export enum TransferRouteStatus {
  CREATED = 'CREATED', // planned, waits for the previous step
  IN_PROGRESS = 'IN_PROGRESS', // ExecuteTransferRoute sent to the executor
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export interface TransferRouteData {
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
  // what the step produced; null until the step is completed
  readonly result: TransferRouteResult | null
}

export interface TransferRouteModel extends TransferRouteData {
  readonly id: Id
  readonly createdAt: Date
  readonly updatedAt: Date
}
