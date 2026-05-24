import {
  PaymentIntentEntity,
  PaymentIntentEntityStatus,
  PaymentPlatformFeePayerEntityType,
  PaymentOperationEntityType,
} from '../../data-source/postgres/entities/payment-intent.entity'
import {
  PaymentIntentModel,
  PaymentIntentStatus,
  PaymentPlatformFeePayerType,
  PaymentIntentData,
  PaymentOperationType,
} from '../../../module/payment-intent/model/payment-intent.model'
import { Numeric } from '@app/types'
import { integrationTypeToDomain, integrationTypeFromDomain } from '@app/shared'
import { EntityManager } from 'typeorm'

export class PaymentIntentRepositoryMapper {
  static toDomain(entity: PaymentIntentEntity): PaymentIntentModel {
    return {
      id: entity.id,
      operationType: PaymentIntentRepositoryMapper.toDomainOperationType(entity.operationType),
      member: {
        accountId: entity.initiatorAccountId,
        userId: entity.initiatorUserId,
      },
      to: {
        account: entity.toIntegrationAccount,
        platformAccountId: entity.toPlatformAccount,
        accountLinkId: entity.toId ?? undefined,
      },
      fromPlatformAccountId: entity.fromPlatformAccountId,
      fromIntegrationAccount: entity.fromIntegrationAccount,
      status: PaymentIntentRepositoryMapper.toDomainStatus(entity.status),
      integration: integrationTypeToDomain(entity.integration),
      currency: entity.currency,
      amount: Numeric.create(entity.amount),
      platformFee: entity.platformFee,
      platformFeeAccount:
        entity.platformFeeIntegrationAccount && entity.platformFeePlatformAccountId
          ? {
              account: entity.platformFeeIntegrationAccount,
              platformAccountId: entity.platformFeePlatformAccountId,
              accountLinkId: entity.platformFeeAccountId ?? undefined,
            }
          : null,
      platformFeePayer: entity.platformFeePayer
        ? PaymentIntentRepositoryMapper.toDomainPlatformFeePayer(entity.platformFeePayer)
        : null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }

  static fromDomain(model: PaymentIntentData, manager: EntityManager): PaymentIntentEntity {
    return manager.create(PaymentIntentEntity, {
      ...model,
      operationType: PaymentIntentRepositoryMapper.fromDomainOperationType(model.operationType),
      initiatorAccountId: model.member.accountId,
      initiatorUserId: model.member.userId,
      toPlatformAccount: model.to.platformAccountId,
      toIntegrationAccount: model.to.account,
      toId: model.to.accountLinkId,
      to: undefined,
      integration: integrationTypeFromDomain(model.integration),
      platformFeePlatformAccountId: model.platformFeeAccount?.platformAccountId ?? null,
      platformFeeIntegrationAccount: model.platformFeeAccount?.account,
      platformFeeAccountId: model.platformFeeAccount?.accountLinkId,
      platformFeePayer: model.platformFeePayer
        ? PaymentIntentRepositoryMapper.fromDomainPlatformFeePayer(model.platformFeePayer)
        : null,
      platformFeeAccount: undefined,
      status: PaymentIntentRepositoryMapper.fromDomainStatus(model.status),
    })
  }

  private static toDomainPlatformFeePayer(type: PaymentPlatformFeePayerEntityType): PaymentPlatformFeePayerType {
    switch (type) {
      case PaymentPlatformFeePayerEntityType.CLIENT:
        return PaymentPlatformFeePayerType.CLIENT
      case PaymentPlatformFeePayerEntityType.PAYER:
        return PaymentPlatformFeePayerType.PAYER

      default: {
        const _exhaustive: never = type
        throw new Error(`Unhandled payment intent fee payer type: ${String(_exhaustive)}`)
      }
    }
  }

  private static fromDomainPlatformFeePayer(type: PaymentPlatformFeePayerType): PaymentPlatformFeePayerEntityType {
    switch (type) {
      case PaymentPlatformFeePayerType.CLIENT:
        return PaymentPlatformFeePayerEntityType.CLIENT
      case PaymentPlatformFeePayerType.PAYER:
        return PaymentPlatformFeePayerEntityType.PAYER

      default: {
        const _exhaustive: never = type
        throw new Error(`Unhandled payment intent fee payer type: ${String(_exhaustive)}`)
      }
    }
  }

  static fromDomainStatus(status: PaymentIntentStatus): PaymentIntentEntityStatus {
    switch (status) {
      case PaymentIntentStatus.CREATED:
        return PaymentIntentEntityStatus.CREATED
      case PaymentIntentStatus.PROCESSING:
        return PaymentIntentEntityStatus.PROCESSING
      case PaymentIntentStatus.UNDERPAY:
        return PaymentIntentEntityStatus.UNDERPAY
      case PaymentIntentStatus.OVERPAY:
        return PaymentIntentEntityStatus.OVERPAY
      case PaymentIntentStatus.EXACT:
        return PaymentIntentEntityStatus.EXACT
      case PaymentIntentStatus.EXPIRED:
        return PaymentIntentEntityStatus.EXPIRED
      case PaymentIntentStatus.CANCELLED:
        return PaymentIntentEntityStatus.CANCELLED

      default: {
        const _exhaustive: never = status
        throw new Error(`Unhandled payment intent status: ${String(_exhaustive)}`)
      }
    }
  }

  private static toDomainStatus(status: PaymentIntentEntityStatus): PaymentIntentStatus {
    switch (status) {
      case PaymentIntentEntityStatus.CREATED:
        return PaymentIntentStatus.CREATED
      case PaymentIntentEntityStatus.PROCESSING:
        return PaymentIntentStatus.PROCESSING
      case PaymentIntentEntityStatus.UNDERPAY:
        return PaymentIntentStatus.UNDERPAY
      case PaymentIntentEntityStatus.OVERPAY:
        return PaymentIntentStatus.OVERPAY
      case PaymentIntentEntityStatus.EXACT:
        return PaymentIntentStatus.EXACT
      case PaymentIntentEntityStatus.EXPIRED:
        return PaymentIntentStatus.EXPIRED
      case PaymentIntentEntityStatus.CANCELLED:
        return PaymentIntentStatus.CANCELLED

      default: {
        const _exhaustive: never = status
        throw new Error(`Unhandled payment intent status: ${String(_exhaustive)}`)
      }
    }
  }

  private static fromDomainOperationType(operation: PaymentOperationType): PaymentOperationEntityType {
    switch (operation) {
      case PaymentOperationType.USER_REQUEST:
        return PaymentOperationEntityType.USER_REQUEST
      case PaymentOperationType.RELAYER:
        return PaymentOperationEntityType.RELAYER
      case PaymentOperationType.CONSOLIDATION:
        return PaymentOperationEntityType.CONSOLIDATION

      default: {
        const _exhaustive: never = operation
        throw new Error(`Unhandled payment intent operation type: ${String(_exhaustive)}`)
      }
    }
  }

  private static toDomainOperationType(operation: PaymentOperationEntityType): PaymentOperationType {
    switch (operation) {
      case PaymentOperationEntityType.USER_REQUEST:
        return PaymentOperationType.USER_REQUEST
      case PaymentOperationEntityType.RELAYER:
        return PaymentOperationType.RELAYER
      case PaymentOperationEntityType.CONSOLIDATION:
        return PaymentOperationType.CONSOLIDATION

      default: {
        const _exhaustive: never = operation
        throw new Error(`Unhandled payment intent operation type: ${String(_exhaustive)}`)
      }
    }
  }
}
