/**
 * Payment priorities
 * Process incoming transfers (to)
 */
export const PaymentConverterPriority = {
  /** Exact match transfer.amount = payment.amount */
  EXACT: 100,
  /** Multiple consecutive transfers = one payment */
  SEQUENTIAL: 90,
  /** transfer.amount > payment.amount (overpayment) */
  OVERPAY: 80,
  /** transfer.amount < payment.amount (underpayment) */
  UNDERPAY: 70,
  /** Unexpected payment (different currency or no matching payment) */
  MISPAY: 60,
} as const

export type PaymentPriority = (typeof PaymentConverterPriority)[keyof typeof PaymentConverterPriority]
