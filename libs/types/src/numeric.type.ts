import Decimal from 'decimal.js'

const PRECISION = 60

Decimal.set({
  precision: PRECISION,
  rounding: Decimal.ROUND_DOWN,
  toExpNeg: -30,
  toExpPos: 30,
})

export type Numeric = Decimal

export const Numeric = {
  PRECISION: PRECISION,

  ZERO: Decimal(0),

  min(...n: Numeric[]): Numeric {
    return Decimal.min(...n)
  },

  max(...n: Numeric[]): Numeric {
    return Decimal.max(...n)
  },

  isNumeric(value: unknown): boolean {
    return Decimal.isDecimal(value)
  },

  fromExponent(value: Numeric | string | number | bigint, exponent: Numeric | string | number | bigint): Numeric {
    return Decimal(value).div(Numeric.create(10).pow(exponent))
  },

  toExponent(value: Numeric | string | number | bigint, exponent: Numeric | string | number | bigint): string {
    return Decimal(value).mul(Numeric.create(10).pow(exponent)).toString()
  },

  create(value: string | bigint | number | Numeric): Numeric {
    return Decimal(value)
  },
}
