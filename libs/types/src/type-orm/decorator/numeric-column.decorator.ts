import { Column } from 'typeorm'
import { Numeric } from '@app/types/numeric.type'

export interface NumericColumnOptions {
  nullable?: boolean
  default?: string | number
  min?: string | number
  max?: string | number
}

export function NumericColumn(options?: NumericColumnOptions) {
  const scale = 30
  const precision = 60
  const { nullable = false, default: defaultValue, min, max, ...restOptions } = options || {}

  return Column({
    type: 'numeric',
    precision,
    scale,
    nullable,
    ...(defaultValue !== undefined && {
      default: Numeric.create(defaultValue).toFixed(scale),
    }),
    transformer: {
      from: (value: string | null): Numeric | null => {
        return value ? Numeric.create(value) : null
      },
      to: (value: Numeric | string | number | null | undefined): string | null => {
        if (value === null || value === undefined) {
          return nullable ? null : Numeric.ZERO.toFixed(scale)
        }

        const numeric = Numeric.create(value)

        if (min !== undefined && numeric.lt(min)) {
          throw new Error(`Value ${value.toString()} is less than minimum ${min}`)
        }

        if (max !== undefined && numeric.gt(max)) {
          throw new Error(`Value ${value.toString()} exceeds maximum ${max}`)
        }

        const fixed = numeric.toFixed(scale)

        const totalDigits = fixed.replace(/[.-]/g, '').length

        if (totalDigits > 60) {
          throw new Error(
            `Value ${value.toString()} has ${totalDigits} digits, max 60 for NUMERIC(${precision},${scale})`,
          )
        }

        return fixed
      },
    },
    ...restOptions,
  })
}
