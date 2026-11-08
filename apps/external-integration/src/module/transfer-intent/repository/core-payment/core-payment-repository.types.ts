import { IntegrationType } from '@app/shared'
import { IntegrationCurrency, RawNumeric, IntegrationAccount } from '@app/types'

export interface CreatePaymentParams {
  readonly idempotencyKey: string
  readonly integration: IntegrationType
  readonly from: IntegrationAccount
  readonly to: IntegrationAccount
  readonly currency: IntegrationCurrency
  readonly amount: RawNumeric
}
