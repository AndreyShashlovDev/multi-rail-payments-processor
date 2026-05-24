import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn, Index } from 'typeorm'
import { type IntegrationAccount, type IntegrationCurrency, Id, type RawNumeric } from '@app/types'
import { BasicEntity } from '@app/database'
import { TransactionEntity } from './transaction.entity'
import { APP_SCHEMA } from '../integration-postgres.config'
import { IntegrationEntityType } from '@app/shared'

export type TransferEntityMetadata = Record<string, unknown>

export enum OperationEntityType {
  NATIVE_TRANSFER = 1,
  TOKEN_TRANSFER = 2,
  // 'swap', 'stake', etc...
}

@Entity({ name: TransferEntity.NAME, schema: APP_SCHEMA })
@Index('idx_transfer_transaction_id', ['transactionId'])
// partition candidate: add CONCURRENTLY before partitioning by fromIntegration
// @Index('idx_transfer_id_integration', ['id', 'integration'])
export class TransferEntity extends BasicEntity {
  static readonly NAME = 'transfer'

  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id: Id

  @Column({ type: 'bigint' })
  readonly transactionId: Id

  @ManyToOne(() => TransactionEntity, (transaction) => transaction.transfers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  readonly transaction: TransactionEntity

  @Column({ type: 'integer' })
  readonly index: number

  @Column({ type: 'smallint' })
  readonly integration: IntegrationEntityType

  @Column({ type: 'smallint' })
  readonly operation: OperationEntityType

  @Column({ type: 'text' })
  readonly from: IntegrationAccount

  @Column({ type: 'text' })
  readonly to: IntegrationAccount

  @Column({ type: 'text', nullable: true })
  readonly fromOwner: IntegrationAccount | null

  @Column({ type: 'text', nullable: true })
  readonly toOwner: IntegrationAccount | null

  @Column({ type: 'text' })
  readonly currency: IntegrationCurrency

  @Column({ type: 'text' })
  readonly amountRaw: RawNumeric

  @Column({ type: 'bigint', nullable: true })
  readonly transferRouteId: Id | null

  @Column({ type: 'bigint', nullable: true })
  readonly transferIntentId: Id | null

  @Column({ type: 'jsonb', nullable: true })
  readonly metadata: TransferEntityMetadata | null // tx fee and some additional data.
}
