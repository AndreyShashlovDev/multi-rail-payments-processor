import { Entity, PrimaryGeneratedColumn, Column, Unique, Index } from 'typeorm'
import { type IntegrationAccount, Id, type IntegrationCurrency } from '@app/types'
import { APP_SCHEMA } from '../logic-postgres.config'
import { BasicEntity } from '@app/database'
import { IntegrationEntityType } from '@app/shared'

// we can use two strategy. single wallet for account or reserved address by payment
export enum IntegrationAccountEntityStatus {
  AVAILABLE = 1,
  IN_USE = 2,
  FROZEN = 3,
  RETIRED = 4,
}

@Entity({ name: IntegrationAccountEntity.NAME, schema: APP_SCHEMA })
@Index('idx_integration_account_integration_account', ['integration', 'account'])
@Index('idx_integration_account_integration_currency_status', ['integration', 'currency', 'status'])
@Unique('idx_unique_integration_account_custody_account_id', [...IntegrationAccountEntity.UNIQUE])
export class IntegrationAccountEntity extends BasicEntity {
  public static readonly NAME = 'integration_account'
  public static readonly UNIQUE: ReadonlyArray<keyof IntegrationAccountEntity> = ['custodyAccountId']

  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id: Id

  @Column({ type: 'smallint' })
  readonly integration: IntegrationEntityType

  @Column('text')
  readonly account: IntegrationAccount

  @Column({ type: 'text', nullable: true })
  readonly currency: IntegrationCurrency | null

  @Column('bigint')
  readonly custodyAccountId: Id

  @Column({ type: 'smallint', default: IntegrationAccountEntityStatus.AVAILABLE })
  readonly status: IntegrationAccountEntityStatus

  // blocked forever
  // @Column('timestamp', { nullable: true })
  // readonly frozenAt: Date | null
  //
  // @Column('text', { nullable: true })
  // readonly frozenReason: string | null
}
