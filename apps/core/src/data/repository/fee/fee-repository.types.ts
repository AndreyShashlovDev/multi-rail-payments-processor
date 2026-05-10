import { IntegrationType } from '@app/shared'
import { IntegrationCurrency, Numeric } from '@app/types'
import { IntegrationAccountLinkModel } from '../../../shared/model/integration-account-link.model'

export interface GetPlatformFeeParams {
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
}

export interface PlatformFeeResult {
  readonly platformFee: Numeric | null
  readonly platformFeeAccount: IntegrationAccountLinkModel | null
}
