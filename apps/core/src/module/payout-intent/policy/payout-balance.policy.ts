import { Balance } from '@app/shared'
import { Numeric } from '@app/types'
import { InsufficientUserBalanceException } from '../exception/insufficient-user-balance.exception'
import { InsufficientFromIntegrationBalanceException } from '../exception/insufficient-from-integration-balance.exception'

export class PayoutBalancePolicy {
  static validate(params: {
    userBalance: Balance | undefined
    hotIntegrationBalance: Balance | undefined
    totalAmount: Numeric
  }): asserts params is { userBalance: Balance; hotIntegrationBalance: Balance; totalAmount: Numeric } {
    const { userBalance, hotIntegrationBalance, totalAmount } = params

    if (!userBalance || userBalance.available.lt(totalAmount)) {
      throw new InsufficientUserBalanceException(totalAmount, userBalance?.available)
    }

    if (!hotIntegrationBalance || hotIntegrationBalance.available.lt(totalAmount)) {
      throw new InsufficientFromIntegrationBalanceException(totalAmount, hotIntegrationBalance?.available)
    }
  }

  static validateWithPending(
    userBalance: Balance,
    pendingAmount: Numeric,
    amount: Numeric,
  ): asserts userBalance is Balance {
    const effectiveAvailable = userBalance.available.minus(pendingAmount) ?? Numeric.ZERO

    if (effectiveAvailable.lt(amount)) {
      throw new InsufficientUserBalanceException(amount, effectiveAvailable)
    }
  }
}
