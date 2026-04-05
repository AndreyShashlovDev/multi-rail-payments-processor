import { UUID, Numeric, Id, type IntegrationCurrency, type SourceTransactionId } from '@app/types'
import { IntegrationType } from '@app/shared'

export interface PaymentReceiptData {
  readonly intentId: UUID
  readonly amount: Numeric
  readonly integration: IntegrationType
  readonly sourceTxId: SourceTransactionId
  readonly txId: Id
  readonly transferIds: ReadonlySet<Id>
  readonly currency: IntegrationCurrency
  readonly executedAt: Date
}

export interface PaymentReceiptModel extends PaymentReceiptData {
  readonly id: UUID
  readonly createdAt: Date
  readonly updatedAt: Date
}
