import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm'
import { APP_SCHEMA } from '../integration-postgres.config'
import type { UUID, IntegrationAccount, Id, IntegrationCurrency, RawNumeric } from '@app/types'
import { BasicEntity } from '@app/database'
import { TransactionIntentEntity } from './transaction-intent.entity'
import { IntegrationEntityType, IntentEntityType } from '@app/shared'

export enum TransferIntentEntityStatus {
  CREATED = 1,
  ACCEPTED = 2,
  PREPARED = 3, // after held event
  PROCESSING = 4, // send to integration
  COMPLETED = 5,
  CANCELED = 6,
  FAILED = 7,
}

export type TransferIntentEntityMetadata = Record<string, unknown>

@Entity({ name: TransferIntentEntity.NAME, schema: APP_SCHEMA })
@Unique('idx_unique_transfer_intent_intenttype_intentid', [...TransferIntentEntity.UNIQUE])
@Index('idx_transfer_intent_status', ['status'])
@Index('idx_transfer_intent_transaction_intent_id', ['transactionIntentId'])
// partition candidate: add CONCURRENTLY before partitioning by fromIntegration
// @Index('idx_transfer_intent_id_from_integration', ['id', 'fromIntegration'])
export class TransferIntentEntity extends BasicEntity {
  static readonly NAME = 'transfer_intent'
  static readonly UNIQUE: ReadonlyArray<keyof TransferIntentEntity> = ['intentType', 'intentId']

  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id: Id

  @Column({ type: 'smallint' })
  readonly intentType: IntentEntityType

  @Column({ type: 'text' })
  readonly intentId: UUID | Id

  @Column({ type: 'text' })
  readonly estimatedRawFee: RawNumeric

  @Column({ type: 'text' })
  readonly feeCurrency: IntegrationCurrency

  @Column({ type: 'text' })
  readonly fromAccount: IntegrationAccount

  @Column({ type: 'text' })
  readonly fromRawAmount: RawNumeric

  @Column({ type: 'text' })
  readonly fromCurrency: IntegrationCurrency

  @Column({ type: 'smallint' })
  readonly fromIntegration: IntegrationEntityType

  @Column({ type: 'text' })
  readonly toAccount: IntegrationAccount

  @Column({ type: 'text' })
  readonly toRawAmount: RawNumeric

  @Column({ type: 'text' })
  readonly toCurrency: IntegrationCurrency

  @Column({ type: 'smallint' })
  readonly toIntegration: IntegrationEntityType

  @Column({ type: 'smallint' })
  readonly status: TransferIntentEntityStatus

  @Column({ type: 'jsonb', nullable: true })
  readonly metadata: TransferIntentEntityMetadata | null

  @Column({ type: 'bigint', nullable: true })
  readonly transactionIntentId: Id | null

  @ManyToOne(() => TransactionIntentEntity, (tx) => tx.transfers, {
    eager: false,
    persistence: false,
  })
  @JoinColumn()
  readonly transactionIntent: TransactionIntentEntity | null
}
