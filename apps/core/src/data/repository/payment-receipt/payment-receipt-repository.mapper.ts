import { PaymentReceiptData, PaymentReceiptModel } from '../../../module/payment-intent/model/payment-receipt.model'
import { EntityManager } from 'typeorm'
import { PaymentReceiptEntity } from '../../data-source/postgres/entities/payment-receipt.entity'
import { integrationTypeFromDomain, integrationTypeToDomain } from '@app/shared'

export class PaymentReceiptRepositoryMapper {
  static fromDomain(data: PaymentReceiptData, em: EntityManager): PaymentReceiptEntity {
    return em.create(PaymentReceiptEntity, {
      intentId: data.intentId,
      intent: undefined,
      amount: data.amount,
      integration: integrationTypeFromDomain(data.integration),
      sourceTxId: data.sourceTxId,
      txId: data.txId,
      transferIds: Array.from(data.transferIds),
      currency: data.currency,
      executedAt: data.executedAt,
    })
  }

  static toDomain(entity: PaymentReceiptEntity): PaymentReceiptModel {
    return {
      id: entity.id,
      intentId: entity.intentId,
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
