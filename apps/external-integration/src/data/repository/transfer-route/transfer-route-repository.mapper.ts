import {
  TransferRouteEntity,
  TransferRouteEntityStatus,
} from '../../data-source/postgres/entities/transfer-route.entity'
import { TransferRouteModel, TransferRouteStatus, TransferRouteData } from '../../../shared/model/transfer-route.model'
import {
  executionTypeToDomain,
  integrationTypeToDomain,
  executionTypeFromDomain,
  integrationTypeFromDomain,
} from '@app/shared'
import { EntityManager } from 'typeorm'

export class TransferRouteRepositoryMapper {
  static toDomain(entity: TransferRouteEntity): TransferRouteModel {
    return {
      id: entity.id,
      transferIntentId: entity.transferIntentId,
      txIndex: entity.txIndex,
      intentId: entity.intentId,
      executionType: executionTypeToDomain(entity.executionType),
      integration: integrationTypeToDomain(entity.integration),
      initiator: entity.initiator,
      fromAccount: entity.fromAccount,
      toAccount: entity.toAccount,
      rawAmount: entity.rawAmount,
      currency: entity.currency,
      status: TransferRouteRepositoryMapper.toDomainStatus(entity.status),
      transactionIntentId: entity.transactionIntentId,
      txId: entity.txId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }

  static fromDomain(data: TransferRouteData, manager: EntityManager): TransferRouteEntity {
    return manager.create(TransferRouteEntity, {
      transactionIntentId: data.transactionIntentId,
      transferIntentId: data.transferIntentId,
      txId: data.txId,
      intentId: data.intentId,
      txIndex: data.txIndex,
      executionType: executionTypeFromDomain(data.executionType),
      integration: integrationTypeFromDomain(data.integration),
      initiator: data.initiator,
      fromAccount: data.fromAccount,
      toAccount: data.toAccount,
      rawAmount: data.rawAmount,
      currency: data.currency,
      status: TransferRouteRepositoryMapper.fromDomainStatus(data.status),
    })
  }

  static toDomainStatus(status: TransferRouteEntityStatus): TransferRouteStatus {
    switch (status) {
      case TransferRouteEntityStatus.CREATED:
        return TransferRouteStatus.CREATED
      case TransferRouteEntityStatus.PENDING_HOLD:
        return TransferRouteStatus.PENDING_HOLD
      case TransferRouteEntityStatus.HELD:
        return TransferRouteStatus.HELD
      case TransferRouteEntityStatus.IN_PROGRESS:
        return TransferRouteStatus.IN_PROGRESS
      case TransferRouteEntityStatus.COMPLETED:
        return TransferRouteStatus.COMPLETED
      case TransferRouteEntityStatus.CANCELED:
        return TransferRouteStatus.CANCELED
      case TransferRouteEntityStatus.FAILED:
        return TransferRouteStatus.FAILED
    }
  }

  static fromDomainStatus(status: TransferRouteStatus): TransferRouteEntityStatus {
    switch (status) {
      case TransferRouteStatus.CREATED:
        return TransferRouteEntityStatus.CREATED
      case TransferRouteStatus.PENDING_HOLD:
        return TransferRouteEntityStatus.PENDING_HOLD
      case TransferRouteStatus.HELD:
        return TransferRouteEntityStatus.HELD
      case TransferRouteStatus.IN_PROGRESS:
        return TransferRouteEntityStatus.IN_PROGRESS
      case TransferRouteStatus.COMPLETED:
        return TransferRouteEntityStatus.COMPLETED
      case TransferRouteStatus.CANCELED:
        return TransferRouteEntityStatus.CANCELED
      case TransferRouteStatus.FAILED:
        return TransferRouteEntityStatus.FAILED
    }
  }
}
