import { UUID } from '@app/types'

export class MispaymentInvalidStateException extends Error {
  constructor(paymentId: UUID) {
    super(`Payment wrong state of mispayment! payment ${paymentId} same currency as transfer!`)
  }
}
