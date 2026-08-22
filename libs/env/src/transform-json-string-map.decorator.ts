import { applyDecorators } from '@nestjs/common'
import { Transform, TransformFnParams } from 'class-transformer'
import { registerDecorator, ValidationOptions } from 'class-validator'

function fromEnvJsonStringMap({ obj, key }: TransformFnParams): ReadonlyMap<string, string> | undefined {
  const value: unknown = (obj as Record<string, unknown>)[key]

  if (typeof value !== 'string') {
    return undefined
  }

  try {
    const parsed: unknown = JSON.parse(value)

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return undefined
    }

    return new Map(Object.entries(parsed as Record<string, string>))
  } catch {
    return undefined
  }
}

// class-validator validates a field's value *after* transformation, so `@IsJSON()` can't be
// combined with a @Transform that turns the string into a Map — it would validate the Map, not
// the original string, and always fail. This checks the *outcome* of the transform instead:
// parsing only ever produces a Map, so anything else means the source ENV value wasn't a valid
// JSON object string.
function IsStringMap(validationOptions?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    registerDecorator({
      name: 'isStringMap',
      target: target.constructor,
      propertyName: propertyKey as string,
      options: validationOptions,
      validator: {
        validate: (value: unknown): boolean => value instanceof Map,
        defaultMessage: () => `${String(propertyKey)} must be a JSON object string`,
      },
    })
  }
}

/**
 * Parses a JSON object ENV string (e.g. `{"a":"1"}`) into a `ReadonlyMap<string, string>`
 * and validates that parsing actually succeeded.
 *
 * Combine with `@IsOptional()` yourself when the field has a default value.
 */
export function TransformJsonStringMap(): PropertyDecorator {
  return applyDecorators(Transform(fromEnvJsonStringMap), IsStringMap())
}
