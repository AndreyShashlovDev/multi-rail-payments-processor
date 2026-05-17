import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm'
import { APP_SCHEMA } from '../core-postgres.config'
import { Id, IntegrationCurrency, IntegrationAccount, NumericColumn, Numeric } from '@app/types'
import { IntegrationEntityType } from '@app/shared'
import { BasicEntity } from '@app/database'

@Entity({ schema: APP_SCHEMA, name: IntegrationAccountBalanceEntity.NAME })
@Unique('idx_unique_integration_account_currency', Array.from(IntegrationAccountBalanceEntity.UNIQUE))
export class IntegrationAccountBalanceEntity extends BasicEntity {
  static readonly NAME = 'integration_account_balance'
  static readonly PATH = `"${APP_SCHEMA}".${IntegrationAccountBalanceEntity.NAME}`
  static readonly UNIQUE: ReadonlyArray<keyof IntegrationAccountBalanceEntity> = ['integration', 'account', 'currency']

  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id: Id

  @Column({ type: 'smallint' })
  readonly integration: IntegrationEntityType

  @Column({ type: 'text' })
  readonly account: IntegrationAccount

  @Column({ type: 'text' })
  readonly currency: IntegrationCurrency

  @NumericColumn()
  readonly available: Numeric
}
