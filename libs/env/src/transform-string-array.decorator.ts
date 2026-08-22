import { applyDecorators } from '@nestjs/common'
import { Transform, TransformFnParams } from 'class-transformer'
import { IsArray, IsString } from 'class-validator'

function fromEnvStringArray({ obj, key }: TransformFnParams): ReadonlyArray<string> | undefined {
  const value: unknown = (obj as Record<string, unknown>)[key]

  if (value === undefined) {
    return undefined
  }

  if (Array.isArray(value)) {
    return value as ReadonlyArray<string>
  }

  if (typeof value !== 'string') {
    return undefined
  }

  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
}

/**
 * Parses a comma-separated ENV string ("a,b,c") into a trimmed, non-empty string[]
 * and validates the result.
 *
 * Combine with `@IsOptional()` yourself when the field has a default value.
 */
export function TransformStringArray(): PropertyDecorator {
  return applyDecorators(Transform(fromEnvStringArray), IsArray(), IsString({ each: true }))
}
