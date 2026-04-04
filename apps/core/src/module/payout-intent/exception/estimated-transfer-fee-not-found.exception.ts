import { UUID } from '@app/types'

export class EstimatedTransferFeeNotFoundException extends Error {
  constructor(id: UUID) {
    super(`Estimated integration transfer fee not found by id ${id}`)
  }
}
