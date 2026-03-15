import { UUID } from '@app/types'

// todo make entity db for permissions and etc.
export class PlatformMemberModel {
  readonly accountId: UUID
  readonly userId: UUID
}
