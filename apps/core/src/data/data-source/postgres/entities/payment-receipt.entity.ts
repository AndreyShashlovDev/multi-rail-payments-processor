import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm'
import { APP_SCHEMA } from '../core-postgres.config'
import { type UUID, Numeric, NumericColumn, Id, type IntegrationCurrency, type SourceTransactionId } from '@app/types'
import { PaymentIntentEntity } from './payment-intent.entity'
import { BasicEntity } from '@app/database'
import { IntegrationEntityType } from '@app/shared'

@Entity({ schema: APP_SCHEMA, name: PaymentReceiptEntity.NAME })
export class PaymentReceiptEntity extends BasicEntity {
  static readonly NAME = 'payment_receipt'

  @PrimaryGeneratedColumn('uuid')
  readonly id: UUID

  @Column({ type: 'uuid' })
  readonly intentId: UUID

  @ManyToOne(() => PaymentIntentEntity, { createForeignKeyConstraints: false, persistence: false, eager: false })
  @JoinColumn()
  readonly intent: PaymentIntentEntity | undefined

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
