import { Entity, PrimaryGeneratedColumn, Column, Index, Unique } from 'typeorm'
import { APP_SCHEMA } from '../integration-postgres.config'
import type { UUID, IntegrationAccount, Id, IntegrationCurrency, RawNumeric } from '@app/types'
import { BasicEntity } from '@app/database'
import { IntegrationEntityType, IntentEntityType } from '@app/shared'

export enum TransferIntentEntityStatus {
  CREATED = 1,
  PROCESSING = 2, // send to integration
  COMPLETED = 3,
  CANCELED = 4,
  FAILED = 5,
}

@Entity({ name: TransferIntentEntity.NAME, schema: APP_SCHEMA })
@Unique('idx_unique_transfer_intent_intenttype_intentid', [...TransferIntentEntity.UNIQUE])
@Index('idx_transfer_intent_status', ['status'])
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

  @Column({ type: 'text', nullable: true })
  readonly depositId: string | null // cross chain relayer ID
}
