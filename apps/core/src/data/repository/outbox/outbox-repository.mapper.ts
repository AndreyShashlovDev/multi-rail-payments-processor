import { OutboxData, OutboxModel, OutboxStatus } from './outbox-repository.types'
import { EntityManager } from 'typeorm'
import { OutboxEntity, OutboxEntityStats } from '../../data-source/postgres/entities/outbox.entity'

export class OutboxRepositoryMapper {
  static fromDomain(data: OutboxData, manager: EntityManager): OutboxEntity {
    return manager.create(OutboxEntity, {
      id: data.id,
      event: data.event,
      payload: data.payload,
      status: OutboxEntityStats.PENDING,
      retries: 0,
    })
  }

  static toDomain(entity: OutboxEntity): OutboxModel {
    return {
      id: entity.id,
      event: entity.event,
      payload: entity.payload,
      status: OutboxRepositoryMapper.toDomainStatus(entity.status),
      retries: entity.retries,
      sentAt: entity.sentAt ?? null,
      processingAt: entity.processingAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }

  static toDomainStatus(status: OutboxEntityStats): OutboxStatus {
    switch (status) {
      case OutboxEntityStats.PENDING:
        return OutboxStatus.PENDING
      case OutboxEntityStats.PROCESSING:
        return OutboxStatus.PROCESSING
      case OutboxEntityStats.SENT:
        return OutboxStatus.SENT
      case OutboxEntityStats.FAILED:
        return OutboxStatus.FAILED

      default: {
        const _exhaustive: never = status
        throw new Error(`Unhandled outbox status: ${String(_exhaustive)}`)
      }
    }
  }
}
