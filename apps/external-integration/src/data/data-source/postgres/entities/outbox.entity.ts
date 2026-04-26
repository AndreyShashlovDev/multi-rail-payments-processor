import { Column, Entity, PrimaryColumn, Index } from 'typeorm'
import { APP_SCHEMA } from '../integration-postgres.config'
import { BasicEntity } from '@app/database'
import type { OutboxUniqueKey } from '../../../repository/outbox/outbox-repository.types'

export enum OutboxEntityStats {
  PENDING = 1,
  PROCESSING = 2,
  SENT = 3,
  FAILED = 4,
}

@Entity({ schema: APP_SCHEMA, name: OutboxEntity.NAME })
@Index('idx_outbox_status_created_at', ['status', 'createdAt'])
@Index('idx_outbox_processing', ['status', 'processingAt'])
export class OutboxEntity extends BasicEntity {
  static readonly NAME = 'outbox'

  @PrimaryColumn({ type: 'text' })
  readonly id: OutboxUniqueKey

  @Column({ type: 'text' })
  readonly event: string

  @Column({ type: 'text' })
  readonly payload: string

  @Column({ type: 'smallint' })
  readonly status: OutboxEntityStats

  @Column({ type: 'timestamptz', nullable: true })
  readonly sentAt?: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  readonly processingAt?: Date | null

  @Column({ type: 'smallint' })
  readonly retries: number
}
