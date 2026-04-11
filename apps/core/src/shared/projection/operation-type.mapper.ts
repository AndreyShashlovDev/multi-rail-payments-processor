import { PaymentOperationType } from '../../module/payment-intent/model/payment-intent.model'
import { PayoutOperationType } from '../../module/payout-intent/model/payout-intent.model'
import { BalanceChangeOperationType } from '@app/shared/types/balance-change'

export class OperationTypeMapper {
  public static toBalanceChange(operation: PaymentOperationType | PayoutOperationType): BalanceChangeOperationType {
    switch (operation) {
      case PaymentOperationType.USER_REQUEST:
      case PayoutOperationType.USER_REQUEST:
        return BalanceChangeOperationType.USER_REQUEST

      case PaymentOperationType.CONSOLIDATION:
      case PayoutOperationType.CONSOLIDATION:
        return BalanceChangeOperationType.CONSOLIDATION

      default: {
        const _exhaustive: never = operation
        throw new Error(`Unknown operation type: ${String(_exhaustive)}`)
      }
    }
  }
}
