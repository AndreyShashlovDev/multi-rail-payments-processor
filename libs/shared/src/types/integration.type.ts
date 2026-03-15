export enum IntegrationEntityType {
  INTERNAL = 1,
  ETHEREUM = 2,
  POLYGON = 3,
}

export enum IntegrationType {
  INTERNAL = 'INTERNAL',
  ETHEREUM = 'ETHEREUM',
  POLYGON = 'POLYGON',
}

export function integrationTypeToDomain(integration: IntegrationEntityType): IntegrationType {
  switch (integration) {
    case IntegrationEntityType.INTERNAL:
      return IntegrationType.INTERNAL
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
    case IntegrationType.INTERNAL:
      return IntegrationEntityType.INTERNAL
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
