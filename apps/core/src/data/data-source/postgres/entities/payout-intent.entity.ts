import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, Index } from 'typeorm'
import { APP_SCHEMA } from '../core-postgres.config'
import { type UUID, Id, NumericColumn, type IntegrationCurrency, Numeric } from '@app/types'
import type { IntegrationAccount } from '@app/types/integration-account'
import { BasicEntity } from '@app/database'
import { IntegrationAccountLinkEntity } from './integration-account-link.entity'
import { IntegrationEntityType } from '@app/shared'

export enum PayoutIntentEntityStatus {
  CREATED = 1,
  PREPARED = 2,
  HELD = 3,
  PROCESSING = 4,
  CONFIRMING = 5,
  SUCCESS = 6,
  FAILED = 7,
}

export type PayoutIntentEntityMetadata = Record<string, unknown>

@Entity({ name: PayoutIntentEntity.NAME, schema: APP_SCHEMA })
@Index('idx_payout_intent_status', ['status'])
export class PayoutIntentEntity extends BasicEntity {
  public static readonly NAME = 'payout_intent'

  @PrimaryGeneratedColumn('uuid')
  readonly id: UUID

  @Column({ type: 'uuid' })
  readonly initiatorAccountId: UUID

  @Column({ type: 'uuid' })
  readonly initiatorUserId: UUID

  @Column({ type: 'text' })
  readonly fromIntegrationAccount: IntegrationAccount

  @Column({ type: 'uuid' })
  readonly fromPlatformAccount: UUID

  // We put our hot wallet here. Or, if the user has a permanent wallet linked, we put it here.
  // Only a REGULAR wallet can be here.
  @Column({ type: 'bigint', nullable: true })
  readonly fromId: Id | null

  @OneToOne(() => IntegrationAccountLinkEntity, {
    createForeignKeyConstraints: false,
    persistence: false,
    eager: false,
    nullable: true,
  })
  @JoinColumn()
  readonly from?: IntegrationAccountLinkEntity | null

  @NumericColumn()
  readonly fromAmount: Numeric

  @Column({ type: 'text' })
  readonly fromCurrency: IntegrationCurrency

  @Column({ type: 'smallint' })
  readonly fromIntegration: IntegrationEntityType

  // We display in the currency in which the payment is made (calculated).
  @NumericColumn()
  readonly estimatedFee: Numeric

  /*
   And we charge NO more than the calculated amount.
    (If the person sending the request pays the fee, we strictly limit the transaction price.)
    You can only pay fees from a hard-linked IntegrationAccountLinkEntity account.
    This can be either a platform account or a dedicated executor account (for example, for a batch).
    Or the user has a linked account (in which case it must be on the same network).
   */
  @Column({ type: 'text' })
  readonly estimatedFeeCurrency: IntegrationCurrency

  // platform commission in the same currency as the underlying transfer
  @NumericColumn({ nullable: true })
  readonly platformFee: Numeric | null

  @Column({ type: 'text', nullable: true })
  readonly platformFeeIntegrationAccount: IntegrationAccount | null

  @Column({ type: 'uuid', nullable: true })
  readonly platformFeePlatformAccount: UUID | null

  @Column({ type: 'bigint', nullable: true })
  readonly platformFeeAccountId: Id

  @OneToOne(() => IntegrationAccountLinkEntity, {
    createForeignKeyConstraints: false,
    persistence: false,
    eager: false,
    nullable: true,
  })
  @JoinColumn()
  readonly platformFeeAccount?: IntegrationAccountLinkEntity | null

  @Column({ type: 'text', nullable: true })
  readonly integrationFeePayerIntegrationAccount: IntegrationAccount | null

  @Column({ type: 'uuid', nullable: true })
  readonly integrationFeePayerPlatformAccount: UUID | null

  @Column({ type: 'bigint', nullable: true })
  readonly integrationFeePayerId: Id | null

  @OneToOne(() => IntegrationAccountLinkEntity, {
    createForeignKeyConstraints: false,
    persistence: false,
    eager: false,
    nullable: true,
  })
  @JoinColumn()
  readonly integrationFeePayer?: IntegrationAccountLinkEntity | null

  @NumericColumn({ nullable: true })
  readonly integrationFee: Numeric | null

  @Column({ type: 'text' })
  readonly integrationFeeCurrency: IntegrationCurrency

  @NumericColumn()
  readonly integrationFeeRate: Numeric

  // fromCurrency to toCurrency (cross-chain example)
  @NumericColumn({ nullable: true })
  readonly exchangeRate: Numeric | null

  @Column({ type: 'text' })
  readonly toIntegrationAccount: IntegrationAccount

  @Column({ type: 'uuid', nullable: true })
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

  @NumericColumn()
  readonly toAmount: Numeric

  @Column({ type: 'text' })
  readonly toCurrency: IntegrationCurrency

  @Column({ type: 'smallint' })
  readonly toIntegration: IntegrationEntityType

  @Column({ type: 'smallint', default: PayoutIntentEntityStatus.CREATED })
  readonly status: PayoutIntentEntityStatus

  @Column({ type: 'jsonb', nullable: true })
  readonly metadata: PayoutIntentEntityMetadata | null
}
