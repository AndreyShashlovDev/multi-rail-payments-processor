export enum ExecutionEntityType {
  NATIVE = 1,
  INTERNAL = 2,
}

export enum ExecutionType {
  NATIVE = 'NATIVE',
  INTERNAL = 'INTERNAL',
}

export function executionTypeToDomain(type: ExecutionEntityType): ExecutionType {
  switch (type) {
    case ExecutionEntityType.NATIVE:
      return ExecutionType.NATIVE
    case ExecutionEntityType.INTERNAL:
      return ExecutionType.INTERNAL

    default: {
      const _exhaustive: never = type
      throw new Error(`Unknown execution type: ${String(_exhaustive)}`)
    }
  }
}

export function executionTypeFromDomain(type: ExecutionType): ExecutionEntityType {
  switch (type) {
    case ExecutionType.NATIVE:
      return ExecutionEntityType.NATIVE
    case ExecutionType.INTERNAL:
      return ExecutionEntityType.INTERNAL

    default: {
      const _exhaustive: never = type
      throw new Error(`Unknown execution type: ${String(_exhaustive)}`)
    }
  }
}
