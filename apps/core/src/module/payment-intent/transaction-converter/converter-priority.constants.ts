/**
 * Payment priorities
 * Process incoming transfers (to)
 */
export const PaymentConverterPriority = {
  /** Exact match transfer.amount = payment.amount */
  EXACT: 100,
  /** transfer.amount > payment.amount (overpayment) */
  UNDERPAY: 90,
  /** transfer.amount < payment.amount (underpayment) */
  OVERPAY: 80,
  /** Unexpected payment (different currency or no matching payment) */
  MISPAY: 70,
} as const

export type PaymentPriority = (typeof PaymentConverterPriority)[keyof typeof PaymentConverterPriority]
