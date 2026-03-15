import { PrimaryGeneratedColumn, OneToOne, Column, Entity, JoinColumn } from 'typeorm'
import { Id } from '@app/types'
import { TransactionEntity } from './transaction.entity'
import { APP_SCHEMA } from '../integration-postgres.config'
import { BasicEntity } from '@app/database'
import { IntegrationEntityType } from '@app/shared'

/**
 * temporal table for raw data of transaction
 */
@Entity({ name: TransactionRawEntity.NAME, schema: APP_SCHEMA })
export class TransactionRawEntity extends BasicEntity {
  static readonly NAME = 'transaction_raw'

  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id: Id

  @Column({ type: 'bigint', unique: true })
  readonly transactionId: Id

  @OneToOne(() => TransactionEntity, {
    createForeignKeyConstraints: false,
    persistence: false,
    eager: false,
  })
  @JoinColumn({ name: 'transactionId' })
  readonly transaction: TransactionEntity

  @Column({ type: 'smallint' })
  readonly integration: IntegrationEntityType // for partitions

  @Column({ type: 'text' })
  readonly data: string // raw tx data
}
