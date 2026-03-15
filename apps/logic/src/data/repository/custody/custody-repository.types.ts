import { IntegrationAccount } from '@app/types/integration-account'
import { IntegrationType } from '@app/shared'
import { IntegrationCurrency, Id } from '@app/types'

export interface IntegrationAccountResult {
  readonly id: Id
  readonly account: IntegrationAccount
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency | null
}
