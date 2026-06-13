import { TransactionEntity, TransactionEntityStatus } from '../../data-source/postgres/entities/transaction.entity'
import { TransactionModel, TransactionData } from '../../../module/transaction/model/transaction.model'
import { EntityManager } from 'typeorm'
import { Id } from '@app/types'
import {
  integrationTypeToDomain,
  integrationTypeFromDomain,
  TransactionStatus,
  executionTypeToDomain,
  executionTypeFromDomain,
} from '@app/shared'
import { TransactionRawEntity } from '../../data-source/postgres/entities/transaction-raw.entity'
import { TransferEntity, OperationEntityType } from '../../data-source/postgres/entities/transfer.entity'
import { TransferModel, TransferData, OperationType } from '../../../module/transaction/model/transfer.model'

export class TransactionRepositoryMapper {
  static toDomainRaw(entity: TransactionEntity, raw: TransactionRawEntity | null = null): TransactionModel {
    return {
      id: Id.create(entity.id),
      executionType: executionTypeToDomain(entity.executionType),
      integration: integrationTypeToDomain(entity.integration),
      initiator: entity.initiator,
      sourceTxId: entity.sourceTxId,
      blockId: entity.blockId,
      blockTime: entity.blockTime,
      status: TransactionRepositoryMapper.toDomainStatus(entity.status),
      metadata: entity.metadata,
      transfers: entity.transfers?.map((item) => TransactionRepositoryMapper.toDomainTransfer(item)) ?? [],
      fee: entity.fee,
      feeCurrency: entity.feeCurrency,
      raw: raw?.data ?? null,
    }
  }

  static fromDomain(model: TransactionData, manager: EntityManager): TransactionEntity {
    return manager.create(TransactionEntity, {
      executionType: executionTypeFromDomain(model.executionType),
      integration: integrationTypeFromDomain(model.integration),
      initiator: model.initiator,
      sourceTxId: model.sourceTxId,
      blockId: model.blockId,
      blockTime: model.blockTime,
      status: TransactionRepositoryMapper.fromDomainStatus(model.status),
      metadata: model.metadata,
      fee: model.fee,
      feeCurrency: model.feeCurrency,
      raw: undefined,
      transfers: model.transfers.map((item) => TransactionRepositoryMapper.fromDomainTransfer(item, manager)),
    })
  }

  static createRawTransaction(
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

  static toDomainTransfer(entity: TransferEntity): TransferModel {
    return {
      id: entity.id,
      transactionId: entity.transactionId,
      integration: integrationTypeToDomain(entity.integration),
      operation: TransactionRepositoryMapper.toDomainTransferOperation(entity.operation),
      index: entity.index,
      initiator: entity.initiator,
      from: entity.from,
      to: entity.to,
      fromOwner: entity.fromOwner ?? entity.from,
      toOwner: entity.toOwner ?? entity.to,
      amountRaw: entity.amountRaw,
      currency: entity.currency,
      transferIntentId: entity.transferIntentId,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
    }
  }

  static fromDomainTransfer(transfer: TransferData, manager: EntityManager): TransferEntity {
    return manager.create(TransferEntity, {
      integration: integrationTypeFromDomain(transfer.integration),
      operation: TransactionRepositoryMapper.fromDomainTransferOperation(transfer.operation),
      index: transfer.index,
      initiator: transfer.initiator,
      from: transfer.from,
      to: transfer.to,
      fromOwner: transfer.fromOwner,
      toOwner: transfer.toOwner,
      amountRaw: transfer.amountRaw,
      currency: transfer.currency,
      transferIntentId: transfer.transferIntentId,
      metadata: transfer.metadata,
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
