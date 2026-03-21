import { Id } from '@app/types'

export class TransferIntentsNotMarkedAsProcessingException extends Error {
  constructor(transactionIntentId: Id) {
    super(`Transfer intents not mark as processing by transaction intent id ${transactionIntentId}`)
  }
}
