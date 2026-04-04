import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { IntegrationAccountEntity } from './integration-account.entity'
import { BasicEntity } from '@app/database'
import { APP_SCHEMA } from '../core-postgres.config'
import type { UUID, Id } from '@app/types'

export enum LinkEntityStatus {
  ACTIVE = 1,
  RELEASED = 2,
  EXPIRED = 3,
}

export enum LinkEntityType {
  REGULAR = 1,
  TEMPORAL = 2,
}

// Assigns IntegrationAccount to a user for a specific TEMPORAL or REGULAR.
// Creates new record for each assignment (supports temporary allocations by releasedAt | expiresAt).
@Entity({ name: IntegrationAccountLinkEntity.NAME, schema: APP_SCHEMA })
@Index('idx_integration_account_link_integration_account_id_status', ['integrationAccountId', 'status'])
@Index('idx_integration_account_link_platform_account_id', ['platformAccountId'])
export class IntegrationAccountLinkEntity extends BasicEntity {
  public static readonly NAME = 'integration_account_link'

  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id: Id

  @Column({ type: 'uuid' })
  readonly platformAccountId: UUID

  @Column({ type: 'uuid' })
  readonly userId: UUID

  @Column({ type: 'bigint' })
  readonly integrationAccountId: Id

  @ManyToOne(() => IntegrationAccountEntity)
  @JoinColumn()
  readonly integrationAccount?: IntegrationAccountEntity

  @Column({ type: 'smallint', default: LinkEntityStatus.ACTIVE })
  readonly status: LinkEntityStatus

  @Column({ type: 'smallint', default: LinkEntityType.TEMPORAL })
  readonly linkType: LinkEntityType

  @Column('timestamp', { nullable: true })
  readonly releasedAt: Date | null

  @Column('timestamp', { nullable: true })
  readonly expiresAt: Date | null
}
