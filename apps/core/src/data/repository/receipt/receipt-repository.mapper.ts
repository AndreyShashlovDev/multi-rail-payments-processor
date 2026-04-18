import { EntityManager } from 'typeorm'
import { ReceiptEntity } from '../../data-source/postgres/entities/receipt.entity'
import {
  integrationTypeFromDomain,
  integrationTypeToDomain,
  intentTypeFromDomain,
  intentTypeToDomain,
} from '@app/shared'
import { ReceiptModel, ReceiptData } from './receipt-repository.types'

export class ReceiptRepositoryMapper {
  static fromDomain(data: ReceiptData, em: EntityManager): ReceiptEntity {
    return em.create(ReceiptEntity, {
      intentId: data.intentId,
      intentType: intentTypeFromDomain(data.intentType),
      amount: data.amount,
      integration: integrationTypeFromDomain(data.integration),
      sourceTxId: data.sourceTxId,
      txId: data.txId,
      transferIds: Array.from(data.transferIds),
      currency: data.currency,
      executedAt: data.executedAt,
    })
  }

  static toDomain(entity: ReceiptEntity): ReceiptModel {
    return {
      id: entity.id,
      intentId: entity.intentId,
      intentType: intentTypeToDomain(entity.intentType),
      amount: entity.amount,
      integration: integrationTypeToDomain(entity.integration),
      sourceTxId: entity.sourceTxId,
      txId: entity.txId,
      transferIds: new Set(entity.transferIds),
      currency: entity.currency,
      executedAt: entity.executedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }
}
