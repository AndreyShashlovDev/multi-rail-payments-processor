import { IntegrationAccount } from '@app/types/integration-account'
import { IntegrationType } from '@app/shared'
import { IntegrationAccountData } from '../../../shared/model/integration-account.model'

export interface CreateAccountData {
  readonly account: Omit<IntegrationAccountData, 'status'>
}

export interface HasAccountsData {
  readonly accounts: ReadonlySet<IntegrationAccount>
}

export interface HasAccountsResult {
  readonly existing: ReadonlySet<IntegrationAccount>
}

export interface GetAccountsData {
  readonly integration: IntegrationType
  readonly addresses: ReadonlySet<IntegrationAccount>
}
