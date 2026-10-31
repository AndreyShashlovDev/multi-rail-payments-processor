import { IntegrationAccount } from '@app/types/integration-account'
import { IntegrationCurrency } from '@app/types'
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
  readonly accounts: ReadonlySet<IntegrationAccount>
}

export interface MakeUseAccountData {
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
}
