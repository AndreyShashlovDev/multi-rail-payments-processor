import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { APP_SCHEMA } from '../integration-postgres.config'
import { Id, IntegrationAccount, IntegrationCurrency, NumericColumn, Numeric, UUID } from '@app/types'
import { IntegrationEntityType, ExecutionEntityType } from '@app/shared'
import { TransferIntentEntity } from './transfer-intent.entity'
import { BasicEntity } from '@app/database'
import { TransactionIntentEntity } from './transaction-intent.entity'

export enum TransferRouteEntityStatus {
  CREATED = 1, // создан, ждёт запуска
  PENDING_HOLD = 2,
  HELD = 3,
  IN_PROGRESS = 4, // transaction_intent создан и в работе
  COMPLETED = 5,
  FAILED = 6,
  CANCELED = 7,
}

@Entity({ schema: APP_SCHEMA, name: TransferRouteEntity.NAME })
@Index(`idx_transfer_route_transfer_intent_id`, ['transferIntentId'])
@Index('idx_transfer_route_transaction_intent_id', ['transactionIntentId'])
@Index('idx_transfer_route_status', ['status'])
@Index('idx_transfer_route_intent_id', ['intentId'])
export class TransferRouteEntity extends BasicEntity {
  static readonly NAME = 'transfer_route' as const

  @PrimaryGeneratedColumn({ type: 'bigint', primaryKeyConstraintName: `PK_${TransferRouteEntity.NAME}` })
  readonly id: Id

  @Column({ type: 'bigint', nullable: true })
  readonly txId: Id | null

  @Column({ type: 'bigint' })
  readonly transferIntentId: Id

  @ManyToOne(() => TransferIntentEntity, { eager: false, persistence: false })
  @JoinColumn()
  readonly transferIntent: TransferIntentEntity

  @Column({ type: 'text' })
  readonly intentId: UUID | Id

  @Column({ type: 'smallint' })
  readonly txIndex: number // index of transaction within same transfer intent

  @Column({ type: 'smallint' })
  readonly executionType: ExecutionEntityType

  @Column({ type: 'smallint' })
  readonly integration: IntegrationEntityType

  @Column({ type: 'text' })
  readonly initiator: IntegrationAccount

  @Column({ type: 'text' })
  readonly fromAccount: IntegrationAccount

  @Column({ type: 'text' })
  readonly toAccount: IntegrationAccount

  @NumericColumn()
  readonly rawAmount: Numeric

  @Column({ type: 'text' })
  readonly currency: IntegrationCurrency

  @Column({ type: 'smallint' })
  readonly status: TransferRouteEntityStatus

  @Column({ type: 'bigint', nullable: true })
  readonly transactionIntentId: Id | null

  @ManyToOne(() => TransactionIntentEntity, { eager: false, persistence: false })
  @JoinColumn()
  readonly transactionIntent?: TransactionIntentEntity | null
}
