import { AbstractInteractor, Numeric, IntegrationCurrency } from '@app/types'
import { IntegrationAccountLinkModel } from '../model/integration-account-link.model'
import { IntegrationType } from '@app/shared'

export interface PlatformFeeProviderResult {
  readonly platformFee: Numeric | null
  readonly platformFeeAccount: IntegrationAccountLinkModel | null
}

export interface PlatformFeeProviderParams {
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
}

export abstract class PlatformFeeProvider extends AbstractInteractor<
  PlatformFeeProviderParams,
  Promise<PlatformFeeProviderResult>
> {}
