import { Id, type UUID, type Numeric, type IntegrationAccount } from '@app/types'
import { IntegrationType } from '@app/shared'

export class PaymentAmountAccumulatorData {
  readonly paymentId: UUID
  readonly integration: IntegrationType
  readonly txId: Id
  readonly transferId: Id
  readonly amount: Numeric
  readonly from: IntegrationAccount
}

export class PaymentAmountAccumulatorModel extends PaymentAmountAccumulatorData {
  readonly id: Id
  readonly createdAt: Date
  readonly updatedAt: Date
}
