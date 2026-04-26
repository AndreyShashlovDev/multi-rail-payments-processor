import {
  IntegrationAccountEntity,
  IntegrationAccountEntityStatus,
} from '../../data-source/postgres/entities/integration-account.entity'
import { IntegrationAccountModel, IntegrationAccountModelStatus } from '../../../shared/model/integration-account.model'
import { integrationTypeToDomain, integrationTypeFromDomain } from '@app/shared'
import { EntityManager } from 'typeorm'

export class IntegrationAccountRepositoryMapper {
  static toDomain(entity: IntegrationAccountEntity): IntegrationAccountModel {
    return {
      ...entity, // fixme remove it. need clear mapping
      integration: integrationTypeToDomain(entity.integration),
      status: IntegrationAccountRepositoryMapper.toDomainStatus(entity.status),
    }
  }

  private static toDomainStatus(status: IntegrationAccountEntityStatus): IntegrationAccountModelStatus {
    switch (status) {
      case IntegrationAccountEntityStatus.AVAILABLE:
        return IntegrationAccountModelStatus.AVAILABLE
      case IntegrationAccountEntityStatus.IN_USE:
        return IntegrationAccountModelStatus.IN_USE
      case IntegrationAccountEntityStatus.FROZEN:
        return IntegrationAccountModelStatus.FROZEN
      case IntegrationAccountEntityStatus.RETIRED:
        return IntegrationAccountModelStatus.RETIRED

      default: {
        const _exhaustive: never = status
        throw new Error(`Unhandled integration account status: ${String(_exhaustive)}`)
      }
    }
  }

  private static fromDomainStatus(status: IntegrationAccountModelStatus): IntegrationAccountEntityStatus {
    switch (status) {
      case IntegrationAccountModelStatus.AVAILABLE:
        return IntegrationAccountEntityStatus.AVAILABLE
      case IntegrationAccountModelStatus.IN_USE:
        return IntegrationAccountEntityStatus.IN_USE
      case IntegrationAccountModelStatus.FROZEN:
        return IntegrationAccountEntityStatus.FROZEN
      case IntegrationAccountModelStatus.RETIRED:
        return IntegrationAccountEntityStatus.RETIRED

      default: {
        const _exhaustive: never = status
        throw new Error(`Unhandled integration account status: ${String(_exhaustive)}`)
      }
    }
  }

  static fromDomain(model: IntegrationAccountModel, manager: EntityManager): IntegrationAccountEntity {
    return manager.create(IntegrationAccountEntity, {
      ...model,
      integration: integrationTypeFromDomain(model.integration),
      status: IntegrationAccountRepositoryMapper.fromDomainStatus(model.status),
    })
  }
}
