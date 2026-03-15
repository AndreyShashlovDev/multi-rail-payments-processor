import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm'
import { APP_SCHEMA } from '../ledger-postgres.config'
import { Id, type UUID, type IntegrationCurrency, NumericColumn, Numeric } from '@app/types'
import { IntegrationType } from '@app/shared'
import { BasicEntity } from '@app/database'

@Entity({ schema: APP_SCHEMA, name: PlatformAccountProjectionEntity.NAME })
@Unique('idx_unique_platform_account_projection_account_integration_currency', [
  ...PlatformAccountProjectionEntity.UNIQUE,
])
export class PlatformAccountProjectionEntity extends BasicEntity {
  static readonly NAME = 'platform_account_projection'
  static readonly UNIQUE: ReadonlyArray<keyof PlatformAccountProjectionEntity> = [
    'accountId',
    'integration',
    'currency',
  ]

  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id: Id

  @Column({ type: 'uuid' })
  readonly accountId: UUID

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
