import {
  PaymentInboxTransferEntity,
  PaymentInboxTransferEntityState,
} from '../../data-source/postgres/entities/payment-inbox-transfer.entity'
import {
  PaymentInboxTransferModel,
  PaymentInboxTransferStatus,
  PaymentInboxTransferData,
} from '../../../module/payment-intent/model/payment-inbox-transfer.model'
import { integrationTypeToDomain, integrationTypeFromDomain } from '@app/shared'
import { EntityManager } from 'typeorm'
import { Numeric } from '@app/types'

export class PaymentInboxTransferRepositoryMapper {
  static toDomain(entity: PaymentInboxTransferEntity): PaymentInboxTransferModel {
    return {
      id: entity.id,
      key: entity.key,
      integration: integrationTypeToDomain(entity.integration),
      to: entity.to,
      currency: entity.currency,
      txId: entity.txId,
      transferId: entity.transferId,
      txStatus: entity.txStatus,
      data: {
        ...entity.data,
        fee: entity.data.fee ? Numeric.create(entity.data.fee) : null,
        transfers: entity.data.transfers.map((transfer) => ({
          ...transfer,
          amount: Numeric.create(transfer.amount),
        })),
      },
      status: PaymentInboxTransferRepositoryMapper.toDomainStatus(entity.state),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }

  static fromDomain(model: PaymentInboxTransferData, manager: EntityManager): PaymentInboxTransferEntity {
    return manager.create(PaymentInboxTransferEntity, {
      txId: model.txId,
      transferId: model.transferId,
      integration: integrationTypeFromDomain(model.integration),
      to: model.to,
      currency: model.currency,
      txStatus: model.txStatus,
      data: model.data,
      state: PaymentInboxTransferEntityState.CREATED,
    })
  }

  private static toDomainStatus(status: PaymentInboxTransferEntityState): PaymentInboxTransferStatus {
    switch (status) {
      case PaymentInboxTransferEntityState.CREATED:
        return PaymentInboxTransferStatus.CREATED
      case PaymentInboxTransferEntityState.BLOCKED:
        return PaymentInboxTransferStatus.BLOCKED

      default: {
        const _exhaustive: never = status

        throw new Error(`Unhandled payment inbox status: ${String(_exhaustive)}`)
      }
    }
  }

  private static fromDomainStatus(status: PaymentInboxTransferStatus): PaymentInboxTransferEntityState {
    switch (status) {
      case PaymentInboxTransferStatus.CREATED:
        return PaymentInboxTransferEntityState.CREATED
      case PaymentInboxTransferStatus.BLOCKED:
        return PaymentInboxTransferEntityState.BLOCKED

      default: {
        const _exhaustive: never = status

        throw new Error(`Unhandled payment inbox status: ${String(_exhaustive)}`)
      }
    }
  }
}
