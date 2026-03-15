import { BalanceChangeType } from '@app/shared'
import { BalanceChangeReason } from '@app/shared/types/balance-change'

export class UnknownEscrowTypeException extends Error {
  constructor(type: BalanceChangeType, reason?: BalanceChangeReason) {
    super(`Unknown escrow type by event. type ${type}, reason: ${reason}`)
  }
}
