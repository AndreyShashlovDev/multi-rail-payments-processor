import { SourceTransactionId } from '@app/types'
import { IntegrationType } from '@app/shared'

export class TransactionIntentNotMarkAsPromotedException extends Error {
  constructor(hash: SourceTransactionId, integration: IntegrationType) {
    super(
      `Transaction Intent not marked as Promoted! wrong state or not found by hash: ${hash}, integration: ${integration}`,
    )
  }
}
