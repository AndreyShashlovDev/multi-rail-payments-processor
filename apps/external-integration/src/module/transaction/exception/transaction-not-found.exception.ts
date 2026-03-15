import { SourceTransactionId } from '@app/types'
import { IntegrationType } from '@app/shared'

export class TransactionNotFoundException extends Error {
  constructor(sourceTxId: SourceTransactionId, integration: IntegrationType) {
    super(`Transaction not found by source tx id ${sourceTxId}, integration: ${integration}`)
  }
}
