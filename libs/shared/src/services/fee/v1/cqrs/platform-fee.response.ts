import { Numeric } from '@app/types'
import { IntegrationAccountLinkModel } from '../../../../../../../apps/core/src/shared/model/integration-account-link.model'

export interface PlatformFeeResponse {
  readonly platformFee: Numeric | null
  // fixme it's should be here? (IntegrationAccountLinkModel wrong use here)
  readonly platformFeeAccount: IntegrationAccountLinkModel | null
}
