import { IntegrationAccount, IntegrationCurrency, RawNumeric } from '@app/types'
import { IntegrationType } from '@app/shared'

export interface RelayerGetAccountParams {
  readonly from: IntegrationAccount
  readonly to: IntegrationAccount
  readonly fromIntegration: IntegrationType
  readonly toIntegration: IntegrationType
  readonly fromCurrency: IntegrationCurrency
  readonly toCurrency: IntegrationCurrency
  readonly fromAmount: RawNumeric
  readonly toAmount: RawNumeric
  readonly platformAccounts: ReadonlySet<IntegrationAccount>
}

export interface Relayer {
  getAccount(params: RelayerGetAccountParams): Promise<IntegrationAccount>

  isSupported(params: RelayerGetAccountParams): boolean
}
