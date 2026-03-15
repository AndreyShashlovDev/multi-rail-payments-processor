import { IntegrationType } from '@app/shared'
import { IntegrationCurrency, IntegrationAccount } from '@app/types'
import { PaymentIntentStatus } from '../../../module/payment-intent/model/payment-intent.model'

export interface FindActiveByParams {
  readonly integration: IntegrationType
  readonly status: PaymentIntentStatus

  readonly params: ReadonlyArray<{
    readonly to: IntegrationAccount
    readonly currency: IntegrationCurrency
  }>
}
