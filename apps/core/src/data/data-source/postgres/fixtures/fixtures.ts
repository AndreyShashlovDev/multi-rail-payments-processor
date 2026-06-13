import 'reflect-metadata'
import dataSource from '../core-postgres.config'
import { AccountEntity, AccountEntityRole } from '../entities/account.entity'
import { randomUUID } from 'node:crypto'
import { IntegrationAccount, UUID, Id } from '@app/types'
import { IntegrationAccountEntity, IntegrationAccountEntityStatus } from '../entities/integration-account.entity'
import { IntegrationEntityType, IntegrationType, integrationTypeFromDomain } from '@app/shared'
import {
  IntegrationAccountLinkEntity,
  LinkEntityStatus,
  LinkEntityType,
} from '../entities/integration-account-link.entity'
import { EntityManager, In } from 'typeorm'
import { IntegrationCurrencyEntity } from '../entities/integration-currency.entity'

const integrationAccounts: ReadonlyMap<IntegrationAccount, IntegrationType> = new Map([
  [IntegrationAccount.create(IntegrationType.ETHEREUM, '0x1'), IntegrationType.ETHEREUM],
  [IntegrationAccount.create(IntegrationType.ETHEREUM, '0x2'), IntegrationType.ETHEREUM],
  [IntegrationAccount.create(IntegrationType.ETHEREUM, '0x3'), IntegrationType.ETHEREUM],
  [IntegrationAccount.create(IntegrationType.ETHEREUM, '0x4'), IntegrationType.ETHEREUM],
  [IntegrationAccount.create(IntegrationType.POLYGON, '0x5'), IntegrationType.POLYGON],
  [IntegrationAccount.create(IntegrationType.POLYGON, '0x6'), IntegrationType.POLYGON],
])

const platformUserId: UUID = randomUUID()
const merchantUser1Id: UUID = randomUUID()
const merchantUser2Id: UUID = randomUUID()

async function runFixtures(): Promise<void> {
  await dataSource.initialize()

  await dataSource.manager.transaction(async (em) => {
    await createCurrencies(em)
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

async function createCurrencies(em: EntityManager) {
  await em.insert(IntegrationCurrencyEntity, {
    code: 'eth',
    name: 'Ethereum',
    symbol: 'eth',
    integration: IntegrationEntityType.ETHEREUM,
    currency: 'native',
    minorUnit: 18,
    displayDecimals: 5,
  })
  await em.insert(IntegrationCurrencyEntity, {
    code: 'matic',
    name: 'Polygon',
    symbol: 'pol',
    integration: IntegrationEntityType.POLYGON,
    currency: 'native',
    minorUnit: 18,
    displayDecimals: 5,
  })
}

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
  const entities = Array.from(integrationAccounts.entries()).map(([account, integration], index) => ({
    account,
    integration: integrationTypeFromDomain(integration),
    custodyAccountId: Id.create(index + 1),
  }))

  await em.createQueryBuilder().insert().into(IntegrationAccountEntity).values(entities).orIgnore().execute()
}

async function createPermanentLink(em: EntityManager) {
  const platform = await em.findOne(AccountEntity, {
    where: {
      owner: platformUserId,
      role: AccountEntityRole.PLATFORM,
    },
  })

  const accounts = await em.find(IntegrationAccountEntity, {
    where: {
      account: In([
        IntegrationAccount.create(IntegrationType.ETHEREUM, '0x1'),
        IntegrationAccount.create(IntegrationType.POLYGON, '0x5'),
      ]),
      status: IntegrationAccountEntityStatus.AVAILABLE,
    },
  })

  if (!platform || !accounts.length) {
    throw new Error('Check platform or account')
  }

  for (const account of accounts) {
    await em.update(IntegrationAccountEntity, { id: account.id }, { status: IntegrationAccountEntityStatus.IN_USE })

    await em.insert(IntegrationAccountLinkEntity, {
      platformAccountId: platform.id,
      userId: platform.owner,
      integrationAccountId: account.id,
      status: LinkEntityStatus.ACTIVE,
      linkType: LinkEntityType.REGULAR,
    })
  }
}
