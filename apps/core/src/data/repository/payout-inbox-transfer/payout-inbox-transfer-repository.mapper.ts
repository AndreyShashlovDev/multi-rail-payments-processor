import { integrationTypeToDomain, integrationTypeFromDomain } from '@app/shared'
import { EntityManager } from 'typeorm'
import {
  PayoutInboxTransferEntity,
  PayoutInboxTransferEntityState,
} from '../../data-source/postgres/entities/payout-inbox-transfer.entity'
import {
  PayoutInboxTransferModel,
  PayoutInboxTransferData,
  PayoutInboxTransferStatus,
} from '../../../module/payout-intent/model/payout-inbox-transfer.model'
import { Numeric } from '@app/types'

export class PayoutInboxTransferRepositoryMapper {
  static toDomain(entity: PayoutInboxTransferEntity): PayoutInboxTransferModel {
    return {
      id: entity.id,
      key: entity.key,
      integration: integrationTypeToDomain(entity.integration),
      intentId: entity.intentId,
      txId: entity.id,
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
      status: PayoutInboxTransferRepositoryMapper.toDomainStatus(entity.state),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }

  static fromDomain(model: PayoutInboxTransferData, manager: EntityManager): PayoutInboxTransferEntity {
    return manager.create(PayoutInboxTransferEntity, {
      txId: model.txId,
      transferId: model.transferId,
      integration: integrationTypeFromDomain(model.integration),
      intentId: model.intentId,
      txStatus: model.txStatus,
      data: model.data,
      state: PayoutInboxTransferEntityState.CREATED,
    })
  }

  private static toDomainStatus(status: PayoutInboxTransferEntityState): PayoutInboxTransferStatus {
    switch (status) {
      case PayoutInboxTransferEntityState.CREATED:
        return PayoutInboxTransferStatus.CREATED
      case PayoutInboxTransferEntityState.BLOCKED:
        return PayoutInboxTransferStatus.BLOCKED

      default: {
        const _exhaustive: never = status

        throw new Error(`Unhandled Payout inbox status: ${String(_exhaustive)}`)
      }
    }
  }

  private static fromDomainStatus(status: PayoutInboxTransferStatus): PayoutInboxTransferEntityState {
    switch (status) {
      case PayoutInboxTransferStatus.CREATED:
        return PayoutInboxTransferEntityState.CREATED
      case PayoutInboxTransferStatus.BLOCKED:
        return PayoutInboxTransferEntityState.BLOCKED

      default: {
        const _exhaustive: never = status

        throw new Error(`Unhandled Payout inbox status: ${String(_exhaustive)}`)
      }
    }
  }
}
