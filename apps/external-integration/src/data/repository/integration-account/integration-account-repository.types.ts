import { IntegrationAccount } from '@app/types'

export interface HasIntegrationAccountParams {
  readonly accounts: ReadonlySet<IntegrationAccount>
}

export interface HasIntegrationAccountResult {
  readonly existing: ReadonlySet<IntegrationAccount>
}
