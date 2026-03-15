import { Column, Entity, PrimaryGeneratedColumn, Unique, OneToMany, OneToOne, Index } from 'typeorm'
import { BasicEntity } from '@app/database'
import { Id, type IntegrationCurrency, RawNumeric } from '@app/types'
import type { TransactionBlockId, TransactionMetadata } from '../../../../module/transaction/model/transaction.model'
import { TransferEntity } from './transfer.entity'
import type { SourceTransactionId } from '@app/types/source-transaction-id.type'
import { APP_SCHEMA } from '../integration-postgres.config'
import { TransactionRawEntity } from './transaction-raw.entity'
import { IntegrationEntityType } from '@app/shared'

export enum TransactionEntityStatus {
  PREPARED = 1,
  PROMOTED = 2,
  ACCEPTED = 3,
  CONFIRMED = 4,
  REJECTED = 5,
  FAILED = 6,
  REORG = 7,
}

@Entity({ name: TransactionEntity.NAME, schema: APP_SCHEMA })
@Unique('idx_unique_sourcetxid_integration', [...TransactionEntity.UNIQUE])
// partition candidate: add CONCURRENTLY before partitioning by fromIntegration
// @Index('idx_transaction_id_integration', ['id', 'integration'])
export class TransactionEntity extends BasicEntity {
  static readonly NAME = 'transaction'
  static readonly UNIQUE: ReadonlyArray<keyof TransactionEntity> = ['sourceTxId', 'integration']

  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id: Id

  @Column({ type: 'smallint' })
  readonly integration: IntegrationEntityType

  @Column({ type: 'text' })
  readonly sourceTxId: SourceTransactionId

  @Column({ type: 'text', nullable: true })
  readonly blockId: TransactionBlockId | null

  @Column({ type: 'timestamp', nullable: true })
  readonly blockTime: Date | null // like a executedAt

  @Column({ type: 'smallint' })
  readonly status: TransactionEntityStatus

  @Column({ type: 'jsonb', nullable: true })
  readonly metadata: TransactionMetadata | null

  @Column({ type: 'text', nullable: true })
  readonly fee: RawNumeric | null

  @Column({ type: 'text' })
  readonly feeCurrency: IntegrationCurrency

  @OneToOne(() => TransactionRawEntity, (raw) => raw.transaction, {
    eager: false,
    persistence: false,
  })
  readonly raw: TransactionRawEntity | null

  @OneToMany(() => TransferEntity, (transfer) => transfer.transaction, {
    cascade: true,
    eager: false,
  })
  readonly transfers: TransferEntity[] | null
}
