import type { UUID } from '@app/types'

export enum AccountRole {
  PLATFORM = 'PLATFORM',
  MERCHANT = 'MERCHANT',
  // etc
}

export interface AccountModel {
  readonly id: UUID
  // todo need user table
  readonly owner: UUID // mapping to user table
  readonly role: AccountRole
}
