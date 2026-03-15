import { Entity, Column, PrimaryColumn } from 'typeorm'
import { APP_SCHEMA } from '../integration-postgres.config'

@Entity({ schema: APP_SCHEMA, name: InboxEntity.NAME })
export class InboxEntity {
  static readonly NAME = 'inbox'

  @PrimaryColumn()
  readonly serviceName: string

  @PrimaryColumn()
  readonly idempotencyKey: string

  @Column({ type: 'text', nullable: true })
  readonly data: string | null
}
