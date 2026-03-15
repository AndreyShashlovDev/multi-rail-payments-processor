import { SourceTransactionId } from '@app/types'
import { IntegrationType } from '@app/shared'

export class TransactionNotMarkAsPromotedException extends Error {
  constructor(hash: SourceTransactionId, integration: IntegrationType) {
    super(`Transaction not marked as Promoted! wrong state or not found by hash: ${hash}, integration: ${integration}`)
  }
}
