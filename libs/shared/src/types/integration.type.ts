export enum IntegrationEntityType {
  PLATFORM = 1,
  ETHEREUM = 2,
  POLYGON = 3,
}

export enum IntegrationType {
  PLATFORM = 'PLATFORM',
  ETHEREUM = 'ETHEREUM',
  POLYGON = 'POLYGON',
}

const types: ReadonlySet<IntegrationType> = new Set(Object.values(IntegrationType))

export function assertIntegrationType(value: string): asserts value is IntegrationType {
  if (!types.has(value as IntegrationType)) {
    throw new Error(`Invalid IntegrationType: "${value}"`)
  }
}

export function integrationTypeToDomain(integration: IntegrationEntityType): IntegrationType {
  switch (integration) {
    case IntegrationEntityType.PLATFORM:
      return IntegrationType.PLATFORM
    case IntegrationEntityType.ETHEREUM:
      return IntegrationType.ETHEREUM
    case IntegrationEntityType.POLYGON:
      return IntegrationType.POLYGON

    default: {
      const _exhaustive: never = integration
      throw new Error(`Unhandled integration entity type: ${String(_exhaustive)}`)
    }
  }
}

export function integrationTypeFromDomain(integration: IntegrationType): IntegrationEntityType {
  switch (integration) {
    case IntegrationType.PLATFORM:
      return IntegrationEntityType.PLATFORM
    case IntegrationType.ETHEREUM:
      return IntegrationEntityType.ETHEREUM
    case IntegrationType.POLYGON:
      return IntegrationEntityType.POLYGON

    default: {
      const _exhaustive: never = integration
      throw new Error(`Unhandled integration domain type: ${String(_exhaustive)}`)
    }
  }
}
