export enum IntentEntityType {
  PAYOUT = 1,
  PAYMENT = 2,
}

export enum IntentType {
  PAYOUT = 'PAYOUT',
  PAYMENT = 'PAYMENT',
}

export function intentTypeToDomain(intent: IntentEntityType): IntentType {
  switch (intent) {
    case IntentEntityType.PAYOUT:
      return IntentType.PAYOUT

    case IntentEntityType.PAYMENT:
      return IntentType.PAYMENT

    default: {
      const _exhaustive: never = intent
      throw new Error(`Unhandled intent entity type: ${String(_exhaustive)}`)
    }
  }
}

export function intentTypeFromDomain(intent: IntentType): IntentEntityType {
  switch (intent) {
    case IntentType.PAYOUT:
      return IntentEntityType.PAYOUT
    case IntentType.PAYMENT:
      return IntentEntityType.PAYMENT

    default: {
      const _exhaustive: never = intent
      throw new Error(`Unhandled intent domain type: ${String(_exhaustive)}`)
    }
  }
}
