import { Id, SourceTransactionId, Numeric, IntegrationCurrency } from '@app/types'
import { TransferModel } from './transfer.model'
import { IntegrationType, TransactionStatus } from '@app/shared'

export interface TransactionModel {
  readonly id: Id
  readonly sourceTxId: SourceTransactionId
  readonly integration: IntegrationType
  readonly status: TransactionStatus
  readonly transfers: ReadonlyArray<TransferModel>
  readonly fee: Numeric | null
  readonly feeCurrency: IntegrationCurrency
  readonly executedAt: Date | null
}
