import { Entity, Unique, PrimaryColumn } from 'typeorm'
import { APP_SCHEMA } from '../ledger-postgres.config'

@Entity({ schema: APP_SCHEMA, name: BalanceEventInboxEntity.NAME })
@Unique('IDX_UNIQUE_KEY', [...BalanceEventInboxEntity.UNIQUE])
export class BalanceEventInboxEntity {
  static readonly NAME = 'balance_event_inbox'
  static readonly UNIQUE: ReadonlyArray<keyof BalanceEventInboxEntity> = ['key']

  @PrimaryColumn()
  readonly key: string
}
