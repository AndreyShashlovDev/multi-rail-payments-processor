/**
 * Payout priorities
 * Process outgoing transfers (from)
 */
export const PayoutConverterPriority = {
  SINGLE_INTEGRATION: 100,
} as const

export type PayoutPriority = (typeof PayoutConverterPriority)[keyof typeof PayoutConverterPriority]
