import { Id, SourceTransactionId, Numeric, IntegrationCurrency, IntegrationAccount } from '@app/types'
import { TransferModel } from './transfer.model'
import { IntegrationType, TransactionStatus, ExecutionType } from '@app/shared'

export interface TransactionModel {
  readonly id: Id
  readonly executionType: ExecutionType
  readonly integration: IntegrationType
  readonly initiator: IntegrationAccount
  readonly sourceTxId: SourceTransactionId
  readonly status: TransactionStatus
  readonly transfers: ReadonlyArray<TransferModel>
  readonly fee: Numeric | null
  readonly feeCurrency: IntegrationCurrency
  readonly executedAt: Date | null
}
