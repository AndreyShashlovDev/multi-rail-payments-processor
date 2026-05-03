import { IntegrationAccount } from '@app/types/integration-account'
import { IntegrationType, ExchangeType } from '@app/shared'
import { IntegrationCurrency, Id } from '@app/types'

export interface IntegrationAccountResult {
  readonly id: Id
  readonly exchangeType: ExchangeType
  readonly account: IntegrationAccount
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency | null
}
