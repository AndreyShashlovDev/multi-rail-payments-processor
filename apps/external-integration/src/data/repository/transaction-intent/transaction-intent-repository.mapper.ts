import {
  TransactionIntentEntity,
  TransactionIntentEntityStatus,
} from '../../data-source/postgres/entities/transaction-intent.entity'
import {
  TransactionIntentModel,
  TransactionIntentStatus,
  TransactionIntentData,
  TransactionIntentMetadata,
} from '../../../module/transaction-intent/model/transaction-intent.model'
import { TransferIntentEntity } from '../../data-source/postgres/entities/transfer-intent.entity'
import { TransferIntentRepositoryMapper } from '../transfer-intent/transfer-intent-repository.mapper'
import { EntityManager } from 'typeorm'
import { TransferIntentModel } from '../../../module/transfer-intent/model/transfer-intent.model'
import {
  integrationTypeToDomain,
  integrationTypeFromDomain,
  executionTypeToDomain,
  executionTypeFromDomain,
} from '@app/shared'

export class TransactionIntentRepositoryMapper {
  static toDomain(
    entity: TransactionIntentEntity,
    transfers: ReadonlyArray<TransferIntentModel>,
  ): TransactionIntentModel {
    return {
      id: entity.id,
      executionType: executionTypeToDomain(entity.executionType),
      txId: entity.txId,
      integration: integrationTypeToDomain(entity.integration),
      status: TransactionIntentRepositoryMapper.toDomainStatus(entity.status),
      nonce: entity.nonce,
      rawData: entity.rawData as unknown as TransactionIntentMetadata,
      signedData: entity.signedData,
      transfers,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }

  static toDomainRaw(
    entity: TransactionIntentEntity,
    transfers: ReadonlyArray<TransferIntentEntity>,
  ): TransactionIntentModel {
    return {
      id: entity.id,
      executionType: executionTypeToDomain(entity.executionType),
      txId: entity.txId,
      integration: integrationTypeToDomain(entity.integration),
      status: TransactionIntentRepositoryMapper.toDomainStatus(entity.status),
      nonce: entity.nonce,
      rawData: entity.rawData as unknown as TransactionIntentMetadata,
      signedData: entity.signedData,
      transfers: transfers.map((transfer) => TransferIntentRepositoryMapper.toDomain(transfer)),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }

  static fromDomain(model: TransactionIntentData, manager: EntityManager): TransactionIntentEntity {
    return manager.create(TransactionIntentEntity, {
      executionType: executionTypeFromDomain(model.executionType),
      txId: model.txId,
      integration: integrationTypeFromDomain(model.integration),
      nonce: model.nonce,
      rawData: model.rawData as unknown as Record<string, unknown>,
      transfers: model.transfers.map((transfer) => TransferIntentRepositoryMapper.fromDomain(transfer, manager)),
    })
  }

  static fromDomainStatus(status: TransactionIntentStatus): TransactionIntentEntityStatus {
    switch (status) {
      case TransactionIntentStatus.HOLD_PENDING:
        return TransactionIntentEntityStatus.HOLD_PENDING
      case TransactionIntentStatus.READY_FOR_SIGNING:
        return TransactionIntentEntityStatus.READY_FOR_SIGNING
      case TransactionIntentStatus.SIGNING:
        return TransactionIntentEntityStatus.SIGNING
      case TransactionIntentStatus.READY_TO_PROMOTE:
        return TransactionIntentEntityStatus.READY_TO_PROMOTE
      case TransactionIntentStatus.PROMOTED:
        return TransactionIntentEntityStatus.PROMOTED
      case TransactionIntentStatus.COMPLETED:
        return TransactionIntentEntityStatus.COMPLETED
      case TransactionIntentStatus.REJECTED:
        return TransactionIntentEntityStatus.REJECTED
      case TransactionIntentStatus.FAILED:
        return TransactionIntentEntityStatus.FAILED

      default: {
        const _exhaustive: never = status
        throw new Error(`Unhandled transaction intent status: ${String(_exhaustive)}`)
      }
    }
  }

  static toDomainStatus(status: TransactionIntentEntityStatus): TransactionIntentStatus {
    switch (status) {
      case TransactionIntentEntityStatus.HOLD_PENDING:
        return TransactionIntentStatus.HOLD_PENDING
      case TransactionIntentEntityStatus.READY_FOR_SIGNING:
        return TransactionIntentStatus.READY_FOR_SIGNING
      case TransactionIntentEntityStatus.SIGNING:
        return TransactionIntentStatus.SIGNING
      case TransactionIntentEntityStatus.READY_TO_PROMOTE:
        return TransactionIntentStatus.READY_TO_PROMOTE
      case TransactionIntentEntityStatus.PROMOTED:
        return TransactionIntentStatus.PROMOTED
      case TransactionIntentEntityStatus.COMPLETED:
        return TransactionIntentStatus.COMPLETED
      case TransactionIntentEntityStatus.REJECTED:
        return TransactionIntentStatus.REJECTED
      case TransactionIntentEntityStatus.FAILED:
        return TransactionIntentStatus.FAILED

      default: {
        const _exhaustive: never = status
        throw new Error(`Unhandled transaction intent status: ${String(_exhaustive)}`)
      }
    }
  }
}
