import {
  TransferIntentEntity,
  TransferIntentEntityStatus,
} from '../../data-source/postgres/entities/transfer-intent.entity'
import {
  TransferIntentModel,
  TransferIntentStatus,
  TransferIntentData,
} from '../../../module/transfer-intent/model/transfer-intent.model'
import {
  intentTypeToDomain,
  integrationTypeToDomain,
  integrationTypeFromDomain,
  intentTypeFromDomain,
  ExecutionEntityType,
} from '@app/shared'
import { EntityManager } from 'typeorm'

export class TransferIntentRepositoryMapper {
  static toDomain(entity: TransferIntentEntity): TransferIntentModel {
    return {
      id: entity.id,
      intentId: entity.intentId,
      intentType: intentTypeToDomain(entity.intentType),
      estimatedRawFee: entity.estimatedRawFee,
      feeCurrency: entity.feeCurrency,
      fromRawAmount: entity.fromRawAmount,
      fromIntegration: integrationTypeToDomain(entity.fromIntegration),
      fromCurrency: entity.fromCurrency,
      fromAccount: entity.fromAccount,
      toRawAmount: entity.toRawAmount,
      toIntegration: integrationTypeToDomain(entity.toIntegration),
      toCurrency: entity.toCurrency,
      toAccount: entity.toAccount,
      status: TransferIntentRepositoryMapper.toDomainStatus(entity.status),
      transactionIntentId: entity.transactionIntentId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }

  static fromDomain(model: TransferIntentData, manager: EntityManager): TransferIntentEntity {
    return manager.create(TransferIntentEntity, {
      intentId: model.intentId,
      intentType: intentTypeFromDomain(model.intentType),
      executionType: ExecutionEntityType.INTERNAL,
      estimatedRawFee: model.estimatedRawFee,
      feeCurrency: model.feeCurrency,
      fromRawAmount: model.fromRawAmount,
      fromIntegration: integrationTypeFromDomain(model.fromIntegration),
      fromCurrency: model.fromCurrency,
      fromAccount: model.fromAccount,
      toRawAmount: model.toRawAmount,
      toIntegration: integrationTypeFromDomain(model.toIntegration),
      toCurrency: model.toCurrency,
      toAccount: model.toAccount,
      transactionIntent: undefined,
    })
  }

  static toDomainStatus(status: TransferIntentEntityStatus): TransferIntentStatus {
    switch (status) {
      case TransferIntentEntityStatus.CREATED:
        return TransferIntentStatus.CREATED
      case TransferIntentEntityStatus.ACCEPTED:
        return TransferIntentStatus.ACCEPTED
      case TransferIntentEntityStatus.PREPARED:
        return TransferIntentStatus.PREPARED
      case TransferIntentEntityStatus.PROCESSING:
        return TransferIntentStatus.PROCESSING
      case TransferIntentEntityStatus.COMPLETED:
        return TransferIntentStatus.COMPLETED
      case TransferIntentEntityStatus.CANCELED:
        return TransferIntentStatus.CANCELED
      case TransferIntentEntityStatus.FAILED:
        return TransferIntentStatus.FAILED

      default: {
        const _exhaustive: never = status

        throw new Error(`Unhandled transfer intent status: ${String(_exhaustive)}`)
      }
    }
  }

  static fromDomainStatus(status: TransferIntentStatus): TransferIntentEntityStatus {
    switch (status) {
      case TransferIntentStatus.CREATED:
        return TransferIntentEntityStatus.CREATED
      case TransferIntentStatus.ACCEPTED:
        return TransferIntentEntityStatus.ACCEPTED
      case TransferIntentStatus.PREPARED:
        return TransferIntentEntityStatus.PREPARED
      case TransferIntentStatus.PROCESSING:
        return TransferIntentEntityStatus.PROCESSING
      case TransferIntentStatus.COMPLETED:
        return TransferIntentEntityStatus.COMPLETED
      case TransferIntentStatus.CANCELED:
        return TransferIntentEntityStatus.CANCELED
      case TransferIntentStatus.FAILED:
        return TransferIntentEntityStatus.FAILED

      default: {
        const _exhaustive: never = status

        throw new Error(`Unhandled transfer intent status: ${String(_exhaustive)}`)
      }
    }
  }
}
