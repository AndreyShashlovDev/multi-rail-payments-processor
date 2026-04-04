import { Balance } from '@app/shared'
import { Numeric } from '@app/types'
import { InsufficientUserBalanceException } from '../exception/insufficient-user-balance.exception'
import {
  InsufficientFromIntegrationBalanceException,
} from '../exception/insufficient-from-integration-balance.exception'

export class PayoutBalancePolicy {
  static validate(
    userBalance: Balance | undefined,
    hotIntegrationBalance: Balance | undefined,
    totalAmount: Numeric,
  ): void {
    if (!userBalance || userBalance.available.lt(totalAmount)) {
      throw new InsufficientUserBalanceException(totalAmount, userBalance?.available)
    }

    if (!hotIntegrationBalance || hotIntegrationBalance.available.lt(totalAmount)) {
      throw new InsufficientFromIntegrationBalanceException(totalAmount, hotIntegrationBalance?.available)
    }
  }
}
