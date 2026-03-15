import type { UUID } from '@app/types'
import { PrimaryGeneratedColumn, Entity, Column } from 'typeorm'
import { BasicEntity } from '@app/database'
import { APP_SCHEMA } from '../logic-postgres.config'

export enum AccountEntityRole {
  PLATFORM = 1,
  MERCHANT = 2,
  // etc
}

@Entity({ schema: APP_SCHEMA, name: AccountEntity.NAME })
export class AccountEntity extends BasicEntity {
  static readonly NAME = 'account'

  @PrimaryGeneratedColumn('uuid')
  readonly id: UUID

  @Column('uuid') // OneToOne User
  readonly owner: UUID // mapping to user table

  @Column({ type: 'smallint' })
  readonly role: AccountEntityRole
}
