export enum ExchangeEntityType {
  PLATFORM = 1,
  NATIVE = 0,
}

export enum ExchangeType {
  PLATFORM = 'PLATFORM',
  NATIVE = 'NATIVE',
}

export function exchangeTypeToDomain(type: ExchangeEntityType): ExchangeType {
  switch (type) {
    case ExchangeEntityType.PLATFORM:
      return ExchangeType.PLATFORM
    case ExchangeEntityType.NATIVE:
      return ExchangeType.NATIVE

    default: {
      const _exhaustive: never = type
      throw new Error(`Unknown exchange type: ${String(_exhaustive)}`)
    }
  }
}

export function exchangeTypeFromDomain(type: ExchangeType): ExchangeEntityType {
  switch (type) {
    case ExchangeType.PLATFORM:
      return ExchangeEntityType.PLATFORM
    case ExchangeType.NATIVE:
      return ExchangeEntityType.NATIVE

    default: {
      const _exhaustive: never = type
      throw new Error(`Unknown exchange type: ${String(_exhaustive)}`)
    }
  }
}
