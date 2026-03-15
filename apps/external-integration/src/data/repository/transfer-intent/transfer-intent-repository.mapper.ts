import {
  TransferIntentEntity,
  TransferIntentEntityStatus,
} from '../../data-source/postgres/entities/transfer-intent.entity'
import {
  TransferIntentModel,
  TransferIntentStatus,
  TransferIntentData,
} from '../../../module/transfer-intent/model/transfer-intent.model'
import {
  intentTypeToDomain,
  integrationTypeToDomain,
  integrationTypeFromDomain,
  intentTypeFromDomain,
} from '@app/shared'
import { plainToInstance } from 'class-transformer'
import { TransferIntentCreateEvent } from '@app/shared/services/external-integration/v1'
import { validateSync } from 'class-validator'
import { EntityManager } from 'typeorm'
import { TransferIntentEventModel, TransferIntentEventKeyType } from './transfer-intent-repository.types'
import { TransferIntentHeldEvent } from '@app/shared/services/external-integration/v1/event/transfer-intent-held.event'
import { TransferIntentCreateEventModel } from '../../../module/transfer-intent/model/transfer-intent.create-event.model'
import { TransferIntentHeldEventModel } from '../../../module/transfer-intent/model/transfer-intent-held-event.model'

export class TransferIntentRepositoryMapper {
  static async validateTransferIntentEvent<T extends TransferIntentEventKeyType>(
    type: T,
    event: TransferIntentCreateEvent | TransferIntentHeldEvent,
  ): Promise<TransferIntentEventModel<T>> {
    if (type === 'create') {
      const instance = plainToInstance(TransferIntentCreateEvent, event, {
        exposeDefaultValues: true,
      })

      await TransferIntentRepositoryMapper.validate(instance)

      return {
        ...instance,
        fromRawAmount: instance.fromAmount,
        toRawAmount: instance.toAmount,
      } satisfies TransferIntentCreateEventModel as unknown as TransferIntentEventModel<T>
    } else if (type === 'held') {
      const instance = plainToInstance(TransferIntentHeldEvent, event, {
        exposeDefaultValues: true,
      })

      await TransferIntentRepositoryMapper.validate(instance)

      return {
        intentType: instance.intentType,
        intentIds: new Set(instance.intentIds),
      } satisfies TransferIntentHeldEventModel as unknown as TransferIntentEventModel<T>
    }

    throw new Error(`Unsupported transfer intent event type: ${type}`)
  }

  private static async validate(instance: object): Promise<void> {
    const errors = validateSync(instance, {
      whitelist: true,
      forbidNonWhitelisted: false,
    })

    if (errors.length > 0) {
      throw new Error(
        `Validation failed: ${errors.map((e) => Object.values(e.constraints || {}).join(', ')).join('; ')}`,
      )
    }
  }

  static toDomain(entity: TransferIntentEntity): TransferIntentModel {
    return {
      ...entity,
      fromIntegration: integrationTypeToDomain(entity.fromIntegration),
      toIntegration: integrationTypeToDomain(entity.toIntegration),
      intentType: intentTypeToDomain(entity.intentType),
      status: TransferIntentRepositoryMapper.toDomainStatus(entity.status),
    }
  }

  static fromDomain(model: TransferIntentData, manager: EntityManager): TransferIntentEntity {
    return manager.create(TransferIntentEntity, {
      ...model,
      fromIntegration: integrationTypeFromDomain(model.fromIntegration),
      toIntegration: integrationTypeFromDomain(model.toIntegration),
      intentType: intentTypeFromDomain(model.intentType),
      status: TransferIntentRepositoryMapper.fromDomainStatus(model.status),
      transactionIntent: undefined,
    })
  }

  static toDomainStatus(status: TransferIntentEntityStatus): TransferIntentStatus {
    switch (status) {
      case TransferIntentEntityStatus.CREATED:
        return TransferIntentStatus.CREATED
      case TransferIntentEntityStatus.ACCEPTED:
        return TransferIntentStatus.ACCEPTED
      case TransferIntentEntityStatus.PREPARED:
        return TransferIntentStatus.PREPARED
      case TransferIntentEntityStatus.PROCESSING:
        return TransferIntentStatus.PROCESSING
      case TransferIntentEntityStatus.COMPLETED:
        return TransferIntentStatus.COMPLETED
      case TransferIntentEntityStatus.CANCELED:
        return TransferIntentStatus.CANCELED
      case TransferIntentEntityStatus.FAILED:
        return TransferIntentStatus.FAILED

      default: {
        const _exhaustive: never = status

        throw new Error(`Unhandled transfer intent status: ${String(_exhaustive)}`)
      }
    }
  }

  static fromDomainStatus(status: TransferIntentStatus): TransferIntentEntityStatus {
    switch (status) {
      case TransferIntentStatus.CREATED:
        return TransferIntentEntityStatus.CREATED
      case TransferIntentStatus.ACCEPTED:
        return TransferIntentEntityStatus.ACCEPTED
      case TransferIntentStatus.PREPARED:
        return TransferIntentEntityStatus.PREPARED
      case TransferIntentStatus.PROCESSING:
        return TransferIntentEntityStatus.PROCESSING
      case TransferIntentStatus.COMPLETED:
        return TransferIntentEntityStatus.COMPLETED
      case TransferIntentStatus.CANCELED:
        return TransferIntentEntityStatus.CANCELED
      case TransferIntentStatus.FAILED:
        return TransferIntentEntityStatus.FAILED

      default: {
        const _exhaustive: never = status

        throw new Error(`Unhandled transfer intent status: ${String(_exhaustive)}`)
      }
    }
  }
}
