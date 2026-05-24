import { Entity, Column, OneToMany, Index, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { APP_SCHEMA } from '../integration-postgres.config'
import { BasicEntity } from '@app/database'
import { type SourceTransactionId, Id, RawNumeric, type IntegrationCurrency, IntegrationAccount } from '@app/types'
import { IntegrationEntityType, ExecutionEntityType } from '@app/shared'
import { TransferRouteEntity } from './transfer-route.entity'

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
@Index('idx_transaction_intent_initiator_integration', ['initiator', 'integration'])
@Unique('idx_unique_transaction_intent_tx_id_integration', [...TransactionIntentEntity.UNIQUE])
export class TransactionIntentEntity extends BasicEntity {
  static readonly NAME = 'transaction_intent'
  static readonly UNIQUE: ReadonlyArray<keyof TransactionIntentEntity> = ['sourceTxId', 'integration']

  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id: Id

  @Column({ type: 'smallint' })
  readonly executionType: ExecutionEntityType

  @Column({ type: 'smallint' })
  readonly integration: IntegrationEntityType

  @Column({ type: 'text' })
  readonly initiator: IntegrationAccount

  @Column('text')
  readonly sourceTxId: SourceTransactionId // some hash or another id by integration

  @Column({ type: 'smallint' })
  readonly status: TransactionIntentEntityStatus

  @Column({ type: 'text', nullable: true })
  readonly fee: RawNumeric | null

  @Column({ type: 'text' })
  readonly feeCurrency: IntegrationCurrency

  @Column({ type: 'jsonb' })
  readonly rawData: Record<string, unknown>

  @Column({ type: 'text', nullable: true })
  readonly signedData: string | null

  @OneToMany(() => TransferRouteEntity, (op) => op.transactionIntent, {
    eager: false,
    persistence: false,
  })
  readonly transferRoutes: TransferRouteEntity[]

  @Column({ type: 'text', nullable: true })
  readonly metadata: TransactionIntentMetadata
}
