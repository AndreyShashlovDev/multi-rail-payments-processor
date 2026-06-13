import { IntegrationType } from '@app/shared'
import { IntegrationCurrency, RawNumeric, IntegrationAccount } from '@app/types'

export interface GetRelayerAccountParams {
  readonly fromIntegration: IntegrationType
  readonly fromAccount: IntegrationAccount
  readonly fromCurrency: IntegrationCurrency
  readonly fromAmount: RawNumeric

  readonly toIntegration: IntegrationType
  readonly toAccount: IntegrationAccount
  readonly toCurrency: IntegrationCurrency
  readonly toAmount: RawNumeric
}
