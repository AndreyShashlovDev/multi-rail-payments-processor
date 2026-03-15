import 'reflect-metadata'
import dataSource from '../logic-postgres.config'
import { AccountEntity, AccountEntityRole } from '../entities/account.entity'
import { randomUUID } from 'node:crypto'
import { IntegrationAccount, UUID, Id } from '@app/types'
import { IntegrationAccountEntity, IntegrationAccountEntityStatus } from '../entities/integration-account.entity'
import { IntegrationEntityType, IntegrationType } from '@app/shared'
import {
  IntegrationAccountLinkEntity,
  LinkEntityStatus,
  LinkEntityType,
} from '../entities/integration-account-link.entity'
import { EntityManager } from 'typeorm'

const integration = IntegrationEntityType.ETHEREUM
const integrationAccounts: IntegrationAccount[] = [
  IntegrationAccount.create(IntegrationType.ETHEREUM, '0x1'),
  IntegrationAccount.create(IntegrationType.ETHEREUM, '0x2'),
  IntegrationAccount.create(IntegrationType.ETHEREUM, '0x3'),
  IntegrationAccount.create(IntegrationType.ETHEREUM, '0x4'),
]
const platformUserId: UUID = randomUUID()
const merchantUser1Id: UUID = randomUUID()
const merchantUser2Id: UUID = randomUUID()

async function runFixtures(): Promise<void> {
  await dataSource.initialize()

  await dataSource.manager.transaction(async (em) => {
    await createAccountFixtures(em)
    await createIntegrationAccounts(em)
    await createPermanentLink(em)
  })

  await dataSource.destroy()
}

runFixtures()
  .then(() => {
    console.log('✅ Make fixtures completed')
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Make fixtures failed:', err)
    process.exit(1)
  })

async function createAccountFixtures(em: EntityManager) {
  await em.insert(AccountEntity, {
    owner: platformUserId,
    role: AccountEntityRole.PLATFORM,
  })

  await em.insert(AccountEntity, {
    owner: merchantUser1Id,
    role: AccountEntityRole.MERCHANT,
  })

  await em.insert(AccountEntity, {
    owner: merchantUser2Id,
    role: AccountEntityRole.MERCHANT,
  })
}

async function createIntegrationAccounts(em: EntityManager) {
  await em
    .createQueryBuilder()
    .insert()
    .into(IntegrationAccountEntity)
    .values(
      integrationAccounts.map((account, index) => ({
        account: account,
        integration: integration,
        custodyAccountId: Id.create(index + 1),
      })),
    )
    .orIgnore()
    .execute()
}

async function createPermanentLink(em: EntityManager) {
  const platform = await em.findOne(AccountEntity, {
    where: {
      owner: platformUserId,
      role: AccountEntityRole.PLATFORM,
    },
  })

  const account = await em.findOne(IntegrationAccountEntity, {
    where: {
      account: IntegrationAccount.create(IntegrationType.ETHEREUM, '0x1'),
      status: IntegrationAccountEntityStatus.AVAILABLE,
    },
  })

  if (!platform || !account) {
    throw new Error('Check platform or account')
  }

  await em.update(IntegrationAccountEntity, { id: account.id }, { status: IntegrationAccountEntityStatus.IN_USE })

  await em.insert(IntegrationAccountLinkEntity, {
    platformAccountId: platform.id,
    userId: platform.owner,
    integrationAccountId: account.id,
    status: LinkEntityStatus.ACTIVE,
    linkType: LinkEntityType.REGULAR,
  })
}
