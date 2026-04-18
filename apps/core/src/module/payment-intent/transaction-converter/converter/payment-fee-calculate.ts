import { Numeric } from '@app/types'
import { PaymentIntentModel } from '../../model/payment-intent.model'
import Decimal from 'decimal.js'

export const PaymentFeeCalculate = (
  payment: PaymentIntentModel,
  transferAmount: Numeric,
  accumulatedAmount: Numeric,
  minorUnit: number,
): Numeric => {
  if (!payment.platformFee || payment.platformFee.lte(Numeric.ZERO) || payment.amount.lte(Numeric.ZERO)) {
    return Numeric.ZERO
  }

  const isLastTransfer = accumulatedAmount.plus(transferAmount).gte(payment.amount)
  const feePercent = payment.platformFee.div(payment.amount)

  if (isLastTransfer) {
    const alreadyPaidFee = accumulatedAmount.mul(feePercent).toDecimalPlaces(minorUnit, Decimal.ROUND_FLOOR)

    return payment.platformFee.minus(alreadyPaidFee)
  }

  return transferAmount.mul(feePercent).toDecimalPlaces(minorUnit, Decimal.ROUND_FLOOR)
}
