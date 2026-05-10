import { Entity, Column, OneToMany, Index, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { APP_SCHEMA } from '../integration-postgres.config'
import { TransferIntentEntity } from './transfer-intent.entity'
import { BasicEntity } from '@app/database'
import type { SourceTransactionId, Id } from '@app/types'
import { IntegrationEntityType, ExecutionEntityType } from '@app/shared'

export type TransactionIntentMetadata = Record<string, unknown>

export enum TransactionIntentEntityStatus {
  HOLD_PENDING = 1,
  READY_FOR_SIGNING = 2,
  SIGNING = 3,
  READY_TO_PROMOTE = 4,
  PROMOTED = 5,
  COMPLETED = 6,
  REJECTED = 7,
  FAILED = 8,
}

@Entity({ name: TransactionIntentEntity.NAME, schema: APP_SCHEMA })
@Index('idx_transaction_intent_status', ['status'])
@Unique('idx_unique_transaction_intent_tx_id_integration', [...TransactionIntentEntity.UNIQUE])
export class TransactionIntentEntity extends BasicEntity {
  static readonly NAME = 'transaction_intent'
  static readonly UNIQUE: ReadonlyArray<keyof TransactionIntentEntity> = ['txId', 'integration']

  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id: Id

  @Column({ type: 'smallint' })
  readonly executionType: ExecutionEntityType

  @Column('text')
  readonly txId: SourceTransactionId // some hash or another id by integration

  @Column({ type: 'smallint' })
  readonly integration: IntegrationEntityType

  @Column({ type: 'integer', default: '0' })
  readonly nonce: number

  @Column({ type: 'smallint' })
  readonly status: TransactionIntentEntityStatus

  @Column({ type: 'jsonb' })
  readonly rawData: Record<string, unknown>

  @Column({ type: 'text', nullable: true })
  readonly signedData: string | null

  @OneToMany(() => TransferIntentEntity, (op) => op.transactionIntent, {
    eager: false,
    persistence: false,
  })
  readonly transfers: TransferIntentEntity[]

  @Column({ type: 'text', nullable: true })
  readonly metadata: TransactionIntentMetadata
}
