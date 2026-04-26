import { randomUUID } from 'node:crypto'
import { IntegrationAccountLinkModel, LinkModelType, LinkModelStatus } from '../../model/integration-account-link.model'
import { IntegrationAccountFactory } from './integration-account.factory'
import { Id } from '@app/types'

export class IntegrationAccountLinkFactory {
  static create(overrides?: Partial<IntegrationAccountLinkModel>): IntegrationAccountLinkModel {
    return {
      id: Id.create(1),
      platformAccountId: randomUUID(),
      userId: randomUUID(),
      integrationAccount: IntegrationAccountFactory.create(),
      status: LinkModelStatus.ACTIVE,
      linkType: LinkModelType.TEMPORAL,
      releasedAt: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }
  }

  static createRegular(overrides?: Partial<IntegrationAccountLinkModel>): IntegrationAccountLinkModel {
    return this.create({
      linkType: LinkModelType.REGULAR,
      ...overrides,
    })
  }
}
