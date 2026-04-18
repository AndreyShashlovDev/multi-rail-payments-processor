import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { APP_SCHEMA } from '../core-postgres.config'
import { type UUID, Numeric, NumericColumn, Id, type IntegrationCurrency, type SourceTransactionId } from '@app/types'
import { BasicEntity } from '@app/database'
import { IntegrationEntityType, IntentEntityType } from '@app/shared'

@Entity({ schema: APP_SCHEMA, name: ReceiptEntity.NAME })
export class ReceiptEntity extends BasicEntity {
  static readonly NAME = 'receipt'

  @PrimaryGeneratedColumn('uuid')
  readonly id: UUID

  @Column({ type: 'uuid' })
  readonly intentId: UUID

  @Column({ type: 'smallint' })
  readonly intentType: IntentEntityType

  @NumericColumn()
  readonly amount: Numeric

  @Column({ type: 'smallint' })
  readonly integration: IntegrationEntityType

  @Column({ type: 'text' })
  readonly sourceTxId: SourceTransactionId

  @Column({ type: 'bigint' })
  readonly txId: Id

  @Column({ type: 'bigint', array: true })
  readonly transferIds: Id[]

  @Column({ type: 'text' })
  readonly currency: IntegrationCurrency

  @Column({ type: 'timestamptz' })
  readonly executedAt: Date
}
