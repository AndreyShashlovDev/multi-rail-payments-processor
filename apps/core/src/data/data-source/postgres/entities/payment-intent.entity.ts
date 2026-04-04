import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, Index } from 'typeorm'
import { type UUID, Id, NumericColumn, type IntegrationCurrency, Numeric, IntegrationAccount } from '@app/types'
import { APP_SCHEMA } from '../core-postgres.config'
import { BasicEntity } from '@app/database'
import { IntegrationAccountLinkEntity } from './integration-account-link.entity'
import { IntegrationEntityType } from '@app/shared'

export enum PaymentIntentEntityStatus {
  CREATED = 1,
  // when we catch the created event from a transaction, we transfer it to confirming
  // wait for the incoming payment to be validated
  CONFIRMING = 2,
  // after receiving the balance update event, we change it to needed status
  UNDERPAY = 3,
  OVERPAY = 4,
  COMPLETED = 5,
  EXPIRED = 6,
  CANCELLED = 7,
}

export enum PaymentPlatformFeePayerEntityType {
  CLIENT = 1,
  PAYER = 2,
}

export enum PaymentOperationEntityType {
  USER_REQUEST = 1,
  CONSOLIDATION = 2, // for example, top-up etc.
}

export type PaymentIntentEntityMetadata = Record<string, unknown>

@Entity({ name: PaymentIntentEntity.NAME, schema: APP_SCHEMA })
@Index('idx_payment_intent_integration_currency_status', ['integration', 'currency', 'status'])
export class PaymentIntentEntity extends BasicEntity {
  public static readonly NAME = 'payment_intent'

  @PrimaryGeneratedColumn('uuid')
  readonly id: UUID

  @Column({ type: 'smallint' })
  readonly operationType: PaymentOperationEntityType

  @Column({ type: 'uuid' })
  readonly initiatorAccountId: UUID

  @Column({ type: 'uuid' })
  readonly initiatorUserId: UUID

  @Column({ type: 'text' })
  readonly toIntegrationAccount: IntegrationAccount

  @Column({ type: 'uuid' })
  readonly toPlatformAccount: UUID

  @Column({ type: 'bigint', nullable: true })
  readonly toId: Id | null

  @OneToOne(() => IntegrationAccountLinkEntity, {
    createForeignKeyConstraints: false,
    persistence: false,
    eager: false,
    nullable: true,
  })
  @JoinColumn()
  readonly to?: IntegrationAccountLinkEntity | null

  // for internal transfers. link payment + payout
  @Column({ type: 'uuid', nullable: true })
  readonly fromPlatformAccountId: UUID | null

  // for internal transfers. link payment + payout
  @Column({ type: 'text', nullable: true })
  readonly fromIntegrationAccount: IntegrationAccount | null

  @Column({ type: 'smallint' })
  readonly integration: IntegrationEntityType

  @NumericColumn()
  readonly amount: Numeric

  // not currently used. Is this field needed?
  @NumericColumn()
  readonly paid: Numeric

  @Column({ type: 'text' })
  readonly currency: IntegrationCurrency

  @NumericColumn({ nullable: true })
  readonly platformFee: Numeric | null

  @Column({ type: 'uuid', nullable: true })
  readonly platformFeePlatformAccountId: UUID | null

  // for internal transfers. link payment + payout
  @Column({ type: 'text', nullable: true })
  readonly platformFeeIntegrationAccount: IntegrationAccount | null

  @Column({ type: 'bigint', nullable: true })
  readonly platformFeeAccountId: Id | null

  @OneToOne(() => IntegrationAccountLinkEntity, {
    createForeignKeyConstraints: false,
    persistence: false,
    eager: false,
    nullable: true,
  })
  @JoinColumn()
  readonly platformFeeAccount: IntegrationAccountLinkEntity | null

  @Column({ type: 'smallint', nullable: true })
  readonly platformFeePayer: PaymentPlatformFeePayerEntityType | null

  @Column({ type: 'smallint', default: PaymentIntentEntityStatus.CREATED })
  readonly status: PaymentIntentEntityStatus

  @Column('jsonb', { nullable: true })
  readonly metadata: PaymentIntentEntityMetadata | null
}
