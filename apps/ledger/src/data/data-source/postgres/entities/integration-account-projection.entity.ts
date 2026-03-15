import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm'
import { APP_SCHEMA } from '../ledger-postgres.config'
import { BasicEntity } from '@app/database'
import { Id, type IntegrationCurrency, NumericColumn, Numeric, type IntegrationAccount } from '@app/types'
import { IntegrationType } from '@app/shared'

@Entity({ schema: APP_SCHEMA, name: IntegrationAccountProjectionEntity.NAME })
@Unique('idx_unique_integration_account_projection_account_integration_currency', [
  ...IntegrationAccountProjectionEntity.UNIQUE,
])
export class IntegrationAccountProjectionEntity extends BasicEntity {
  static readonly NAME = 'integration_account_projection'
  static readonly UNIQUE: ReadonlyArray<keyof IntegrationAccountProjectionEntity> = [
    'account',
    'integration',
    'currency',
  ]

  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id: Id

  @Column({ type: 'text' })
  readonly account: IntegrationAccount

  @Column({ type: 'text' })
  readonly integration: IntegrationType

  @Column({ type: 'text' })
  readonly currency: IntegrationCurrency

  @NumericColumn()
  readonly available: Numeric

  @NumericColumn()
  readonly hold: Numeric

  @NumericColumn()
  readonly holdIn: Numeric
}
