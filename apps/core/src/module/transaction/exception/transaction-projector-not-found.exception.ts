import { TransactionStatus } from '@app/shared'

export class TransactionProjectorNotFoundException extends Error {
  constructor(state: TransactionStatus) {
    super(`Transaction projector for state ${state} not found!`)
  }
}
