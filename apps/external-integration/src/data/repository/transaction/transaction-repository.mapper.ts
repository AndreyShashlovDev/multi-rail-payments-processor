import { TransactionEntity, TransactionEntityStatus } from '../../data-source/postgres/entities/transaction.entity'
import { TransactionModel, TransactionData } from '../../../module/transaction/model/transaction.model'
import { EntityManager } from 'typeorm'
import { Id } from '@app/types'
import { integrationTypeToDomain, integrationTypeFromDomain, TransactionStatus } from '@app/shared'
import { TransactionRawEntity } from '../../data-source/postgres/entities/transaction-raw.entity'
import { TransferEntity, OperationEntityType } from '../../data-source/postgres/entities/transfer.entity'
import { TransferModel, TransferData, OperationType } from '../../../module/transaction/model/transfer.model'

export class TransactionRepositoryMapper {
  static toDomainRaw(entity: TransactionEntity, raw: TransactionRawEntity | null = null): TransactionModel {
    return {
      ...entity,
      id: Id.create(entity.id),
      integration: integrationTypeToDomain(entity.integration),
      transfers: entity.transfers?.map((item) => TransactionRepositoryMapper.toDomainTransfer(item)) ?? [],
      metadata: entity.metadata,
      status: TransactionRepositoryMapper.toDomainStatus(entity.status),
      raw: raw?.data ?? null,
    }
  }

  static fromDomain(model: TransactionData, manager: EntityManager): TransactionEntity {
    return manager.create(TransactionEntity, {
      ...model,
      transfers: model.transfers.map((item) => TransactionRepositoryMapper.fromDomainTransfer(item, manager)),
      integration: integrationTypeFromDomain(model.integration),
      status: TransactionRepositoryMapper.fromDomainStatus(model.status),
      raw: undefined,
    })
  }

  public static createRawTransaction(
    transaction: TransactionEntity,
    raw: string,
    manager: EntityManager,
  ): TransactionRawEntity {
    return manager.create(TransactionRawEntity, {
      transactionId: transaction.id,
      integration: transaction.integration,
      data: JSON.stringify(raw),
    })
  }

  static toDomainStatus(status: TransactionEntityStatus): TransactionStatus {
    switch (status) {
      case TransactionEntityStatus.PREPARED:
        return TransactionStatus.PREPARED
      case TransactionEntityStatus.PROMOTED:
        return TransactionStatus.PROMOTED
      case TransactionEntityStatus.ACCEPTED:
        return TransactionStatus.ACCEPTED
      case TransactionEntityStatus.CONFIRMED:
        return TransactionStatus.CONFIRMED
      case TransactionEntityStatus.REJECTED:
        return TransactionStatus.REJECTED
      case TransactionEntityStatus.FAILED:
        return TransactionStatus.FAILED
      case TransactionEntityStatus.REORG:
        return TransactionStatus.FAILED

      default: {
        const _exhaustive: never = status
        throw new Error(`Unhandled transaction status: ${String(_exhaustive)}`)
      }
    }
  }

  static fromDomainStatus(status: TransactionStatus): TransactionEntityStatus {
    switch (status) {
      case TransactionStatus.PREPARED:
        return TransactionEntityStatus.PREPARED
      case TransactionStatus.PROMOTED:
        return TransactionEntityStatus.PROMOTED
      case TransactionStatus.ACCEPTED:
        return TransactionEntityStatus.ACCEPTED
      case TransactionStatus.CONFIRMED:
        return TransactionEntityStatus.CONFIRMED
      case TransactionStatus.REJECTED:
        return TransactionEntityStatus.REJECTED
      case TransactionStatus.FAILED:
        return TransactionEntityStatus.FAILED
      case TransactionStatus.REORG:
        return TransactionEntityStatus.FAILED

      default: {
        const _exhaustive: never = status
        throw new Error(`Unhandled transaction status: ${String(_exhaustive)}`)
      }
    }
  }

  public static toDomainTransfer(transfer: TransferEntity): TransferModel {
    return {
      ...transfer,
      integration: integrationTypeToDomain(transfer.integration),
      operation: TransactionRepositoryMapper.toDomainTransferOperation(transfer.operation),
      fromOwner: transfer.fromOwner ?? transfer.from,
      toOwner: transfer.toOwner ?? transfer.to,
    }
  }

  public static fromDomainTransfer(transfer: TransferData, manager: EntityManager): TransferEntity {
    return manager.create(TransferEntity, {
      ...transfer,
      integration: integrationTypeFromDomain(transfer.integration),
      operation: TransactionRepositoryMapper.fromDomainTransferOperation(transfer.operation),
    })
  }

  private static fromDomainTransferOperation(type: OperationType): OperationEntityType {
    switch (type) {
      case OperationType.NATIVE_TRANSFER:
        return OperationEntityType.NATIVE_TRANSFER
      case OperationType.TOKEN_TRANSFER:
        return OperationEntityType.TOKEN_TRANSFER

      default: {
        const _exhaustive: never = type
        throw new Error(`Unhandled transfer operation type: ${String(_exhaustive)}`)
      }
    }
  }

  private static toDomainTransferOperation(type: OperationEntityType): OperationType {
    switch (type) {
      case OperationEntityType.NATIVE_TRANSFER:
        return OperationType.NATIVE_TRANSFER
      case OperationEntityType.TOKEN_TRANSFER:
        return OperationType.TOKEN_TRANSFER

      default: {
        const _exhaustive: never = type
        throw new Error(`Unhandled transfer operation type: ${String(_exhaustive)}`)
      }
    }
  }
}
