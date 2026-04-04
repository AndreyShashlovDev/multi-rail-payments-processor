import { Numeric, UUID } from '@app/types'
import { DestinationIntegrationAccount } from '../../../shared/model/composite-integration-account.model'

export interface MarkPreparedData {
  readonly id: UUID
  readonly integrationFeePayer: DestinationIntegrationAccount
  readonly integrationFee: Numeric | null
}

export interface MarkConfirmingData extends MarkPreparedData {}
