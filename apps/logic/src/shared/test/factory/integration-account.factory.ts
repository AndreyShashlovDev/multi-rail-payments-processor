import { IntegrationType } from '@app/shared'
import { IntegrationAccount, Id } from '@app/types'
import { IntegrationAccountModel, IntegrationAccountModelStatus } from '../../model/integration-account.model'
import { randomBytes } from 'node:crypto'

export class IntegrationAccountFactory {
  static createAccount(integration: IntegrationType = IntegrationType.ETHEREUM): IntegrationAccount {
    if (integration !== IntegrationType.ETHEREUM) {
      throw new Error('cannot support integration for create currency')
    }

    return IntegrationAccount.create(integration, `0x${randomBytes(20).toString('hex')}`)
  }

  static create(overrides?: Partial<IntegrationAccountModel>): IntegrationAccountModel {
    const id = Id.create(Math.floor(Math.random() * 1000_000_00))

    return {
      id,
      integration: IntegrationType.ETHEREUM,
      account: IntegrationAccountFactory.createAccount(IntegrationType.ETHEREUM),
      custodyAccountId: id,
      currency: null,
      status: IntegrationAccountModelStatus.AVAILABLE,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }
  }
}
