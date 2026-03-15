import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'
import { APP_SCHEMA } from '../ledger-postgres.config'
import { Id, type IntegrationCurrency, NumericColumn, Numeric, type IntegrationAccount, UUID } from '@app/types'
import { IntegrationType, BalanceChangeType, IntentType } from '@app/shared'
import { BasicEntity } from '@app/database'
import type { BalanceChangeMetadata } from '@app/shared/types/balance-change'

@Entity({ schema: APP_SCHEMA, name: IntegrationAccountEsEntity.NAME })
@Index('idx_integration_account_es_account_integration_currency', ['account', 'integration', 'currency'])
@Index('idx_integration_account_es_intent', ['intentType', 'intentId'])
// partition candidate: add CONCURRENTLY before partitioning by fromIntegration
// @Index('idx_integration_account_es_id_integration', ['id', 'integration'])
export class IntegrationAccountEsEntity extends BasicEntity {
  static readonly NAME = 'integration_account_es'

  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id: Id

  @Column({ type: 'text' })
  readonly account: IntegrationAccount

  @Column({ type: 'text' })
  readonly integration: IntegrationType

  @Column({ type: 'text' })
  readonly currency: IntegrationCurrency

  @Column({ type: 'text' })
  readonly changeType: BalanceChangeType

  @NumericColumn()
  readonly amount: Numeric

  @NumericColumn()
  readonly availableAfter: Numeric

  @NumericColumn()
  readonly holdAfter: Numeric

  @NumericColumn()
  readonly holdInAfter: Numeric

  @Column({ type: 'text', nullable: true })
  readonly intentId: UUID | Id | null

  @Column({ type: 'text', nullable: true })
  readonly intentType: IntentType | null

  @Column({ type: 'jsonb' })
  readonly metadata: BalanceChangeMetadata
}
