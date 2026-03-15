import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'
import { APP_SCHEMA } from '../logic-postgres.config'
import { Id, UUID, IntegrationAccount, Numeric, NumericColumn, type IntegrationCurrency } from '@app/types'
import { IntegrationEntityType, IntentEntityType } from '@app/shared'
import { BasicEntity } from '@app/database'
import { BalanceChangeMetadata } from '@app/shared/types/balance-change'

export enum EscrowEntityStatus {
  CREATED = 1,
  PREPARED = 2,
  PROCESSED = 3,
  RESOLVED = 4,
}

export enum EscrowEntityType {
  PLATFORM_FEE_ACCRUED = 1,
  OVERPAY = 2,
  UNDERPAY = 3,
  UNEXPECTED_PAYMENT = 4,
  AMOUNT = 5,
  FEE = 6,
  INTEGRATION_FEE = 7,
}

@Entity({ schema: APP_SCHEMA, name: EscrowEntity.NAME })
@Index('idx_escrow_status_created_at', ['status', 'createdAt'])
@Index('idx_escrow_intent_type_intent_id', ['intentType', 'intentId'])
@Index('idx_escrow_metadata_hash', ['metadataHash'])
export class EscrowEntity extends BasicEntity {
  static readonly NAME = 'escrow'

  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id: Id

  @Column({ type: 'smallint' })
  readonly integration: IntegrationEntityType

  @Column({ type: 'uuid', nullable: true })
  readonly platformAccountId: UUID | null

  @Column({ type: 'text', nullable: true })
  readonly integrationAccount: IntegrationAccount | null

  @NumericColumn()
  readonly amount: Numeric

  @Column({ type: 'text' })
  readonly currency: IntegrationCurrency

  @Column({ type: 'smallint' })
  readonly type: EscrowEntityType

  @Column({ type: 'text', nullable: true })
  readonly intentType: IntentEntityType | null

  @Column({ type: 'text', nullable: true })
  readonly intentId: UUID | Id | null

  @Column({ type: 'smallint' })
  readonly status: EscrowEntityStatus

  @Column({ type: 'jsonb', nullable: true })
  readonly metadata: Omit<BalanceChangeMetadata, 'intentId' | 'intentType'> | null

  @Column({ type: 'text' })
  readonly metadataHash: string
}
