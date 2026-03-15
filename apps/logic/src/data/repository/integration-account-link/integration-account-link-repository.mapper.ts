import {
  IntegrationAccountLinkEntity,
  LinkEntityStatus,
  LinkEntityType,
} from '../../data-source/postgres/entities/integration-account-link.entity'
import {
  IntegrationAccountLinkModel,
  LinkModelStatus,
  LinkModelType,
  IntegrationAccountLinkData,
} from '../../../shared/model/integration-account-link.model'
import { IntegrationAccountRepositoryMapper } from '../integration-account/integration-account-repository.mapper'
import { EntityManager } from 'typeorm'
import { IntegrationAccountEntity } from '../../data-source/postgres/entities/integration-account.entity'

export class IntegrationAccountLinkRepositoryMapper {
  static toDomain(
    entity: IntegrationAccountLinkEntity,
    integrationAccount: IntegrationAccountEntity,
  ): IntegrationAccountLinkModel {
    return {
      ...entity,
      integrationAccount: IntegrationAccountRepositoryMapper.toDomain(integrationAccount),
      status: IntegrationAccountLinkRepositoryMapper.toDomainStatus(entity.status),
      linkType: IntegrationAccountLinkRepositoryMapper.toDomainType(entity.linkType),
    }
  }

  static fromDomain(model: IntegrationAccountLinkData, manager: EntityManager): IntegrationAccountLinkEntity {
    return manager.create(IntegrationAccountLinkEntity, {
      ...model,
      integrationAccountId: model.integrationAccount.id,
      integrationAccount: IntegrationAccountRepositoryMapper.fromDomain(model.integrationAccount, manager),
      status: IntegrationAccountLinkRepositoryMapper.fromDomainStatus(model.status),
      linkType: IntegrationAccountLinkRepositoryMapper.fromDomainType(model.linkType),
    })
  }

  private static toDomainStatus(status: LinkEntityStatus): LinkModelStatus {
    switch (status) {
      case LinkEntityStatus.ACTIVE:
        return LinkModelStatus.ACTIVE
      case LinkEntityStatus.RELEASED:
        return LinkModelStatus.RELEASED
      case LinkEntityStatus.EXPIRED:
        return LinkModelStatus.EXPIRED

      default: {
        const _exhaustive: never = status
        throw new Error(`Unhandled account link status: ${String(_exhaustive)}`)
      }
    }
  }

  private static fromDomainStatus(status: LinkModelStatus): LinkEntityStatus {
    switch (status) {
      case LinkModelStatus.ACTIVE:
        return LinkEntityStatus.ACTIVE
      case LinkModelStatus.RELEASED:
        return LinkEntityStatus.RELEASED
      case LinkModelStatus.EXPIRED:
        return LinkEntityStatus.EXPIRED

      default: {
        const _exhaustive: never = status
        throw new Error(`Unhandled account link status: ${String(_exhaustive)}`)
      }
    }
  }

  private static toDomainType(type: LinkEntityType): LinkModelType {
    switch (type) {
      case LinkEntityType.REGULAR:
        return LinkModelType.REGULAR
      case LinkEntityType.TEMPORAL:
        return LinkModelType.TEMPORAL

      default: {
        const _exhaustive: never = type
        throw new Error(`Unhandled account link type: ${String(_exhaustive)}`)
      }
    }
  }

  private static fromDomainType(type: LinkModelType): LinkEntityType {
    switch (type) {
      case LinkModelType.REGULAR:
        return LinkEntityType.REGULAR
      case LinkModelType.TEMPORAL:
        return LinkEntityType.TEMPORAL

      default: {
        const _exhaustive: never = type
        throw new Error(`Unhandled account link type: ${String(_exhaustive)}`)
      }
    }
  }
}
