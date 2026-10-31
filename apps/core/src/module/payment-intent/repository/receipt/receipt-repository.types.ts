import { UUID, Numeric, type SourceTransactionId, Id, type IntegrationCurrency } from '@app/types'
import { IntentType, IntegrationType } from '@app/shared'

export interface ReceiptData {
  readonly intentId: UUID
  readonly intentType: IntentType
  readonly amount: Numeric
  readonly integration: IntegrationType
  readonly sourceTxId: SourceTransactionId
  readonly txId: Id
  readonly transferIds: ReadonlySet<Id>
  readonly currency: IntegrationCurrency
  readonly executedAt: Date
}

export interface ReceiptModel extends ReceiptData {
  readonly id: UUID
  readonly createdAt: Date
  readonly updatedAt: Date
}

export class SumAmountsParams {
  readonly intentIds: ReadonlySet<UUID>
  readonly intentType: IntentType
}
