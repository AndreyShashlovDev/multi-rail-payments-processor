import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm'
import { APP_SCHEMA } from '../logic-postgres.config'
import { type IntegrationCurrency } from '@app/types'
import { IntegrationType } from '@app/shared'

@Entity({ schema: APP_SCHEMA, name: IntegrationCurrencyEntity.NAME })
@Unique('idx_unique_integration_currency_integration_currency', [...IntegrationCurrencyEntity.UNIQUE])
export class IntegrationCurrencyEntity {
  static readonly NAME = 'integration_currency'
  static readonly UNIQUE: ReadonlyArray<keyof IntegrationCurrencyEntity> = ['integration', 'currency']

  @PrimaryGeneratedColumn()
  readonly id: number

  @Column({ type: 'text' })
  readonly integration: IntegrationType

  @Column({ type: 'text' })
  readonly currency: IntegrationCurrency

  @Column({ type: 'smallint' })
  readonly decimals: number

  @Column({ type: 'smallint' })
  readonly unitExponent: number

  @Column({ type: 'text' })
  readonly alias: string
}
