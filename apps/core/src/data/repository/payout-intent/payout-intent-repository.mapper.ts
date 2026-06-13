import {
  PayoutIntentModel,
  PayoutIntentData,
  PayoutIntentStatus,
  PayoutOperationType,
} from '../../../module/payout-intent/model/payout-intent.model'
import {
  PayoutIntentEntity,
  PayoutIntentEntityStatus,
  PayoutOperationEntityType,
} from '../../data-source/postgres/entities/payout-intent.entity'
import { integrationTypeToDomain, integrationTypeFromDomain } from '@app/shared'
import { EntityManager } from 'typeorm'

export class PayoutIntentRepositoryMapper {
  static toDomain(entity: PayoutIntentEntity): PayoutIntentModel {
    return {
      id: entity.id,
      operationType: PayoutIntentRepositoryMapper.toDomainOperationType(entity.operationType),
      member: {
        accountId: entity.initiatorAccountId,
        userId: entity.initiatorUserId,
      },
      fromAmount: entity.fromAmount,
      fromCurrency: entity.fromCurrency,
      fromIntegration: integrationTypeToDomain(entity.fromIntegration),
      estimatedFee: entity.estimatedFee,
      estimatedFeeCurrency: entity.estimatedFeeCurrency,
      platformFee: entity.platformFee,
      platformFeeAccount:
        entity.platformFeeIntegrationAccount && entity.platformFeePlatformAccount
          ? {
              account: entity.platformFeeIntegrationAccount,
              platformAccountId: entity.platformFeePlatformAccount,
              accountLinkId: entity.platformFeeAccountId,
            }
          : null,
      integrationFee: entity.integrationFee,
      integrationFeeCurrency: entity.integrationFeeCurrency,
      integrationFeeRate: entity.integrationFeeRate,
      exchangeRate: entity.exchangeRate,
      to: {
        account: entity.toIntegrationAccount,
        platformAccountId: entity.toPlatformAccount,
        accountLinkId: entity.toId ?? undefined,
      },
      toAmount: entity.toAmount,
      toCurrency: entity.toCurrency,
      toIntegration: integrationTypeToDomain(entity.toIntegration),
      status: this.toDomainLinkStatus(entity.status),
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }

  static fromDomain(model: PayoutIntentData, manager: EntityManager): PayoutIntentEntity {
    return manager.create(PayoutIntentEntity, {
      operationType: PayoutIntentRepositoryMapper.fromDomainOperationType(model.operationType),
      // member
      initiatorAccountId: model.member.accountId,
      initiatorUserId: model.member.userId,

      fromAmount: model.fromAmount,
      fromCurrency: model.fromCurrency,
      fromIntegration: integrationTypeFromDomain(model.fromIntegration),

      estimatedFee: model.estimatedFee,
      estimatedFeeCurrency: model.estimatedFeeCurrency,

      platformFee: model.platformFee,
      // platformFeeAccount
      platformFeeAccountId: model.platformFeeAccount?.accountLinkId,
      platformFeePlatformAccount: model.platformFeeAccount?.platformAccountId,
      platformFeeAccount: undefined,
      platformFeeIntegrationAccount: model.platformFeeAccount?.account,

      integrationFee: model.integrationFee,
      integrationFeeCurrency: model.integrationFeeCurrency,
      integrationFeeRate: model.integrationFeeRate,

      exchangeRate: model.exchangeRate,

      // to
      toIntegrationAccount: model.to.account,
      toId: model.to.accountLinkId,
      to: undefined,

      toAmount: model.toAmount,
      toCurrency: model.toCurrency,
      toIntegration: integrationTypeFromDomain(model.toIntegration),

      status: PayoutIntentRepositoryMapper.fromDomainLinkStatus(model.status),
      metadata: model.metadata,
    })
  }

  private static toDomainLinkStatus(status: PayoutIntentEntityStatus): PayoutIntentStatus {
    switch (status) {
      case PayoutIntentEntityStatus.CREATED:
        return PayoutIntentStatus.CREATED
      case PayoutIntentEntityStatus.PREPARED:
        return PayoutIntentStatus.PREPARED
      case PayoutIntentEntityStatus.PROCESSING:
        return PayoutIntentStatus.PROCESSING
      case PayoutIntentEntityStatus.CONFIRMING:
        return PayoutIntentStatus.CONFIRMING
      case PayoutIntentEntityStatus.SUCCESS:
        return PayoutIntentStatus.SUCCESS
      case PayoutIntentEntityStatus.FAILED:
        return PayoutIntentStatus.FAILED

      default: {
        const _exhaustive: never = status
        throw new Error(`Unhandled payout intent status: ${String(_exhaustive)}`)
      }
    }
  }

  private static fromDomainLinkStatus(status: PayoutIntentStatus): PayoutIntentEntityStatus {
    switch (status) {
      case PayoutIntentStatus.CREATED:
        return PayoutIntentEntityStatus.CREATED
      case PayoutIntentStatus.PREPARED:
        return PayoutIntentEntityStatus.PREPARED
      case PayoutIntentStatus.PROCESSING:
        return PayoutIntentEntityStatus.PROCESSING
      case PayoutIntentStatus.CONFIRMING:
        return PayoutIntentEntityStatus.CONFIRMING
      case PayoutIntentStatus.SUCCESS:
        return PayoutIntentEntityStatus.SUCCESS
      case PayoutIntentStatus.FAILED:
        return PayoutIntentEntityStatus.FAILED

      default: {
        const _exhaustive: never = status
        throw new Error(`Unhandled payout intent status: ${String(_exhaustive)}`)
      }
    }
  }

  private static fromDomainOperationType(operation: PayoutOperationType): PayoutOperationEntityType {
    switch (operation) {
      case PayoutOperationType.USER_REQUEST:
        return PayoutOperationEntityType.USER_REQUEST
      case PayoutOperationType.CONSOLIDATION:
        return PayoutOperationEntityType.CONSOLIDATION

      default: {
        const _exhaustive: never = operation
        throw new Error(`Unhandled payout intent operation type: ${String(_exhaustive)}`)
      }
    }
  }

  private static toDomainOperationType(operation: PayoutOperationEntityType): PayoutOperationType {
    switch (operation) {
      case PayoutOperationEntityType.USER_REQUEST:
        return PayoutOperationType.USER_REQUEST
      case PayoutOperationEntityType.CONSOLIDATION:
        return PayoutOperationType.CONSOLIDATION

      default: {
        const _exhaustive: never = operation
        throw new Error(`Unhandled payout intent operation type: ${String(_exhaustive)}`)
      }
    }
  }
}
