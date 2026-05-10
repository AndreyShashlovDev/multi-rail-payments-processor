import { Entity, Unique, PrimaryGeneratedColumn, Column } from 'typeorm'
import { APP_SCHEMA } from '../integration-postgres.config'
import { BasicEntity } from '@app/database'
import type { SourceTransactionId } from '@app/types'
import { IntegrationEntityType } from '@app/shared'

@Entity({ schema: APP_SCHEMA, name: InternalBlockEntity.NAME })
@Unique('idx_unique_internal_block', ['integration'])
export class InternalBlockEntity extends BasicEntity {
  static readonly NAME = 'internal_block' as const

  @PrimaryGeneratedColumn()
  readonly id: number

  @Column({ type: 'smallint' })
  readonly integration: IntegrationEntityType

  @Column({ type: 'bigint', default: 0 })
  readonly blockNumber: SourceTransactionId
}
