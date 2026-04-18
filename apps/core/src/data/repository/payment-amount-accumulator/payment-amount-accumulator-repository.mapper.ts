import {
  PaymentAmountAccumulatorData,
  PaymentAmountAccumulatorModel,
} from '../../../module/payment-intent/model/payment-amount-accumulator.model'
import { EntityManager } from 'typeorm'
import { PaymentAmountAccumulatorEntity } from '../../data-source/postgres/entities/payment-amount-accumulator.entity'
import { integrationTypeFromDomain, integrationTypeToDomain } from '@app/shared'

export class PaymentAmountAccumulatorRepositoryMapper {
  static fromDomain(model: PaymentAmountAccumulatorData, manager: EntityManager): PaymentAmountAccumulatorEntity {
    return manager.create(PaymentAmountAccumulatorEntity, {
      paymentId: model.paymentId,
      payment: undefined,
      integration: integrationTypeFromDomain(model.integration),
      txId: model.txId,
      transferId: model.transferId,
      amount: model.amount,
      from: model.from,
    })
  }

  static toDomain(entity: PaymentAmountAccumulatorEntity): PaymentAmountAccumulatorModel {
    return {
      id: entity.id,
      paymentId: entity.paymentId,
      integration: integrationTypeToDomain(entity.integration),
      txId: entity.txId,
      transferId: entity.transferId,
      amount: entity.amount,
      from: entity.from,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }
}
