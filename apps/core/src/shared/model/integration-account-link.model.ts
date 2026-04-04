import { UUID, Id } from '@app/types'
import { IntegrationAccountModel } from './integration-account.model'

export enum LinkModelStatus {
  ACTIVE = 'ACTIVE',
  RELEASED = 'RELEASED',
  EXPIRED = 'EXPIRED',
}

export enum LinkModelType {
  REGULAR = 'REGULAR',
  TEMPORAL = 'TEMPORAL',
}

export interface IntegrationAccountLinkData {
  readonly platformAccountId: UUID
  readonly userId: UUID
  readonly integrationAccount: IntegrationAccountModel
  readonly status: LinkModelStatus
  readonly linkType: LinkModelType
}

export interface IntegrationAccountLinkModel extends IntegrationAccountLinkData {
  readonly id: Id
  readonly releasedAt: Date | null
  readonly expiresAt: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date
}
