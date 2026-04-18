import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm'
import { APP_SCHEMA } from '../core-postgres.config'
import { type IntegrationCurrency } from '@app/types'
import { IntegrationEntityType } from '@app/shared'

@Entity({ schema: APP_SCHEMA, name: IntegrationCurrencyEntity.NAME })
@Unique('idx_unique_integration_currency_integration_currency', Array.from(IntegrationCurrencyEntity.UNIQUE))
export class IntegrationCurrencyEntity {
  static readonly NAME = 'integration_currency'
  static readonly UNIQUE: ReadonlyArray<keyof IntegrationCurrencyEntity> = ['integration', 'currency']

  @PrimaryGeneratedColumn()
  readonly id: number

  @Column({ type: 'text' })
  readonly code: string

  @Column({ type: 'text' })
  readonly name: string

  @Column({ type: 'text' })
  readonly symbol: string

  @Column({ type: 'smallint' })
  readonly integration: IntegrationEntityType

  @Column({ type: 'text' })
  readonly currency: IntegrationCurrency

  @Column({ type: 'smallint' })
  readonly displayDecimals: number

  @Column({ type: 'smallint' })
  readonly minorUnit: number
}
