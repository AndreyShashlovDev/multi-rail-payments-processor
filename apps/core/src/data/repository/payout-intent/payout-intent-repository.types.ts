import { Numeric, UUID } from '@app/types'
import { ExternalIntegrationAccount } from '../../../shared/model/composite-integration-account.model'

export interface MarkPreparedData {
  readonly id: UUID
  readonly integrationFeePayer: ExternalIntegrationAccount
  readonly integrationFee: Numeric | null
}

export interface MarkConfirmingData extends MarkPreparedData {}
