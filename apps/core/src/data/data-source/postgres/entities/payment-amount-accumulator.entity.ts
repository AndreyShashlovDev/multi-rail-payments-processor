import { Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, Column, Unique } from 'typeorm'
import { APP_SCHEMA } from '../core-postgres.config'
import { type Id, type UUID, type Numeric, NumericColumn, type IntegrationAccount } from '@app/types'
import { PaymentIntentEntity } from './payment-intent.entity'
import { BasicEntity } from '@app/database'
import { IntegrationEntityType } from '@app/shared'

@Entity({ schema: APP_SCHEMA, name: PaymentAmountAccumulatorEntity.NAME })
@Unique('idx_uniqie_integration_txid_transferid', Array.from(PaymentAmountAccumulatorEntity.UNIQUE))
export class PaymentAmountAccumulatorEntity extends BasicEntity {
  static readonly NAME = 'payment_amount_accumulator'
  static readonly UNIQUE: ReadonlyArray<keyof PaymentAmountAccumulatorEntity> = ['integration', 'txId', 'transferId']

  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id: Id

  @Column({ type: 'uuid' })
  readonly paymentId: UUID

  @OneToOne(() => PaymentIntentEntity, {
    createForeignKeyConstraints: false,
    persistence: false,
    eager: false,
    nullable: false,
  })
  @JoinColumn()
  readonly payment?: PaymentIntentEntity | null

  @Column({ type: 'smallint' })
  readonly integration: IntegrationEntityType

  @Column({ type: 'bigint' })
  readonly txId: Id

  @Column({ type: 'bigint' })
  readonly transferId: Id

  @NumericColumn()
  readonly amount: Numeric

  @Column({ type: 'text' })
  readonly from: IntegrationAccount
}
