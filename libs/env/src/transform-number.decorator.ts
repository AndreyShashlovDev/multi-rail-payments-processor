import { Transform, TransformFnParams } from 'class-transformer'

function fromEnvNumber({ obj, key }: TransformFnParams): number | undefined {
  const value: unknown = (obj as Record<string, unknown>)[key]

  if (value === undefined || value === '') {
    return undefined
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value !== 'string') {
    return undefined
  }

  return Number(value)
}

/**
 * Parses an ENV string into a number for validation with `@IsNumber()`/`@IsInt()` etc.
 *
 * Unlike class-transformer's `enableImplicitConversion`, an empty string is treated as "not set"
 * (`undefined`) rather than coerced to `0` (`Number('') === 0`), so a blank ENV value falls
 * through to the field's default, or fails required-field validation instead of silently
 * becoming a valid-looking `0`. Garbage input (`Number('abc')` → `NaN`) is still correctly
 * rejected by `@IsNumber()`/`@IsInt()`.
 *
 * Only wraps `@Transform` — combine with whichever number validators the field needs
 * (`@IsNumber()`, `@IsInt()`, `@Min()`, `@Max()`, `@IsPositive()`, ...) and `@IsOptional()`
 * yourself, since those vary per field.
 */
export function TransformNumber(): PropertyDecorator {
  return Transform(fromEnvNumber)
}
