import { applyDecorators } from '@nestjs/common'
import { Transform, TransformFnParams } from 'class-transformer'
import { IsBoolean } from 'class-validator'

// class-transformer's `enableImplicitConversion` coerces booleans via `Boolean(value)`, so the
// string "false" (non-empty) is implicitly converted to `true` before a plain @Transform would
// even see it. Reading straight off `obj`/`key` bypasses that implicit coercion entirely.
function fromEnvBoolean({ obj, key }: TransformFnParams): boolean | undefined {
  const value: unknown = (obj as Record<string, unknown>)[key]

  return value === undefined ? undefined : value === true || value === 'true'
}

/**
 * Correctly parses an ENV string ("true"/"false") into a boolean and validates the result.
 * Bypasses class-transformer's `enableImplicitConversion` coercion, where `Boolean("false")`
 * is `true` because it's a non-empty string.
 *
 * Combine with `@IsOptional()` yourself when the field has a default value.
 */
export function TransformBoolean(): PropertyDecorator {
  return applyDecorators(Transform(fromEnvBoolean), IsBoolean())
}
