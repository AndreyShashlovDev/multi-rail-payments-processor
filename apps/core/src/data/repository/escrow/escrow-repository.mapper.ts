import { EscrowData, EscrowType, EscrowStatus, EscrowModel } from '../../../module/escrow/model/escrow.model'
import { EscrowEntity, EscrowEntityType, EscrowEntityStatus } from '../../data-source/postgres/entities/escrow.entity'
import { EntityManager } from 'typeorm'
import {
  integrationTypeFromDomain,
  intentTypeFromDomain,
  integrationTypeToDomain,
  intentTypeToDomain,
} from '@app/shared'

export class EscrowRepositoryMapper {
  static fromDomain(model: EscrowData, manager: EntityManager): EscrowEntity {
    return manager.create(EscrowEntity, {
      ...model,
      integration: integrationTypeFromDomain(model.integration),
      type: EscrowRepositoryMapper.fromDomainType(model.type),
      status: EscrowRepositoryMapper.fromDomainStatus(model.status),
      intentType: model.intentType ? intentTypeFromDomain(model.intentType) : null,
    })
  }

  static toDomain(entity: EscrowEntity): EscrowModel {
    return {
      ...entity,
      integration: integrationTypeToDomain(entity.integration),
      type: EscrowRepositoryMapper.toDomainType(entity.type),
      status: EscrowRepositoryMapper.toDomainStatus(entity.status),
      intentType: entity.intentType ? intentTypeToDomain(entity.intentType) : null,
    }
  }

  static toDomainType(type: EscrowEntityType): EscrowType {
    switch (type) {
      case EscrowEntityType.PLATFORM_FEE_ACCRUED:
        return EscrowType.PLATFORM_FEE_ACCRUED
      case EscrowEntityType.OVERPAY:
        return EscrowType.OVERPAY
      case EscrowEntityType.UNDERPAY:
        return EscrowType.UNDERPAY
      case EscrowEntityType.UNEXPECTED_PAYMENT:
        return EscrowType.UNEXPECTED_PAYMENT
      case EscrowEntityType.AMOUNT:
        return EscrowType.AMOUNT
      case EscrowEntityType.FEE:
        return EscrowType.FEE
      case EscrowEntityType.INTEGRATION_FEE:
        return EscrowType.INTEGRATION_FEE

      default: {
        const _exhaustive: never = type
        throw new Error(`Unhandled escrow type: ${String(_exhaustive)}`)
      }
    }
  }

  static fromDomainType(type: EscrowType): EscrowEntityType {
    switch (type) {
      case EscrowType.PLATFORM_FEE_ACCRUED:
        return EscrowEntityType.PLATFORM_FEE_ACCRUED
      case EscrowType.OVERPAY:
        return EscrowEntityType.OVERPAY
      case EscrowType.UNDERPAY:
        return EscrowEntityType.UNDERPAY
      case EscrowType.UNEXPECTED_PAYMENT:
        return EscrowEntityType.UNEXPECTED_PAYMENT
      case EscrowType.AMOUNT:
        return EscrowEntityType.AMOUNT
      case EscrowType.FEE:
        return EscrowEntityType.FEE
      case EscrowType.INTEGRATION_FEE:
        return EscrowEntityType.INTEGRATION_FEE

      default: {
        const _exhaustive: never = type
        throw new Error(`Unhandled escrow type: ${String(_exhaustive)}`)
      }
    }
  }

  static toDomainStatus(status: EscrowEntityStatus): EscrowStatus {
    switch (status) {
      case EscrowEntityStatus.CREATED:
        return EscrowStatus.CREATED
      case EscrowEntityStatus.PREPARED:
        return EscrowStatus.PREPARED
      case EscrowEntityStatus.PROCESSED:
        return EscrowStatus.PROCESSED
      case EscrowEntityStatus.RESOLVED:
        return EscrowStatus.RESOLVED

      default: {
        const _exhaustive: never = status
        throw new Error(`Unhandled escrow status: ${String(_exhaustive)}`)
      }
    }
  }

  static fromDomainStatus(status: EscrowStatus): EscrowEntityStatus {
    switch (status) {
      case EscrowStatus.CREATED:
        return EscrowEntityStatus.CREATED
      case EscrowStatus.PREPARED:
        return EscrowEntityStatus.PREPARED
      case EscrowStatus.PROCESSED:
        return EscrowEntityStatus.PROCESSED
      case EscrowStatus.RESOLVED:
        return EscrowEntityStatus.RESOLVED

      default: {
        const _exhaustive: never = status
        throw new Error(`Unhandled escrow status: ${String(_exhaustive)}`)
      }
    }
  }
}
