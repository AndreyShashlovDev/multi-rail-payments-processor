import {
  PayoutIntentModel,
  PayoutIntentData,
  PayoutIntentStatus,
} from '../../../module/payout-intent/model/payout-intent.model'
import { PayoutIntentEntity, PayoutIntentEntityStatus } from '../../data-source/postgres/entities/payout-intent.entity'
import { integrationTypeToDomain, integrationTypeFromDomain } from '@app/shared'
import { EntityManager } from 'typeorm'

export class PayoutIntentRepositoryMapper {
  static toDomain(entity: PayoutIntentEntity): PayoutIntentModel {
    return {
      ...entity,
      member: {
        accountId: entity.initiatorAccountId,
        userId: entity.initiatorUserId,
      },
      from: {
        account: entity.fromIntegrationAccount,
        platformAccountId: entity.fromPlatformAccount,
        accountLinkId: entity.fromId ?? undefined,
      },
      fromIntegration: integrationTypeToDomain(entity.fromIntegration),
      platformFeeAccount:
        entity.platformFeeIntegrationAccount && entity.platformFeePlatformAccount
          ? {
              account: entity.platformFeeIntegrationAccount,
              platformAccountId: entity.platformFeePlatformAccount,
              accountLinkId: entity.platformFeeAccountId,
            }
          : null,
      integrationFeePayer:
        entity.integrationFeePayerIntegrationAccount && entity.integrationFeePayerPlatformAccount
          ? {
              account: entity.integrationFeePayerIntegrationAccount,
              platformAccountId: entity.integrationFeePayerPlatformAccount,
              accountLinkId: entity.integrationFeePayerId ?? undefined,
            }
          : null,
      toIntegration: integrationTypeToDomain(entity.toIntegration),
      to: {
        account: entity.toIntegrationAccount,
        platformAccountId: entity.toPlatformAccount,
        accountLinkId: entity.toId ?? undefined,
      },
      status: this.toDomainLinkStatus(entity.status),
    }
  }

  static fromDomain(model: PayoutIntentData, manager: EntityManager): PayoutIntentEntity {
    return manager.create(PayoutIntentEntity, {
      ...model,
      initiatorAccountId: model.member.accountId,
      initiatorUserId: model.member.userId,

      fromPlatformAccount: model.from.platformAccountId,
      fromIntegrationAccount: model.from.account,
      fromId: model.from.accountLinkId,
      from: undefined,
      fromIntegration: integrationTypeFromDomain(model.fromIntegration),

      platformFeeAccountId: model.platformFeeAccount?.accountLinkId,
      platformFeePlatformAccount: model.platformFeeAccount?.platformAccountId,
      platformFeeAccount: undefined,
      platformFeeIntegrationAccount: model.platformFeeAccount?.account,

      integrationFeePayerIntegrationAccount: model.integrationFeePayer?.account,
      integrationFeePayerPlatformAccount: model.integrationFeePayer?.platformAccountId,
      integrationFeePayerId: model.integrationFeePayer?.accountLinkId,
      integrationFeePayer: undefined,

      toIntegration: integrationTypeFromDomain(model.toIntegration),
      toIntegrationAccount: model.to.account,
      toId: model.to.accountLinkId,
      to: undefined,
      status: PayoutIntentRepositoryMapper.fromDomainLinkStatus(model.status),
    })
  }

  private static toDomainLinkStatus(status: PayoutIntentEntityStatus): PayoutIntentStatus {
    switch (status) {
      case PayoutIntentEntityStatus.CREATED:
        return PayoutIntentStatus.CREATED
      case PayoutIntentEntityStatus.PREPARED:
        return PayoutIntentStatus.PREPARED
      case PayoutIntentEntityStatus.HELD:
        return PayoutIntentStatus.HELD
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
      case PayoutIntentStatus.HELD:
        return PayoutIntentEntityStatus.HELD
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
}
