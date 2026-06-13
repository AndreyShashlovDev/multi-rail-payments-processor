import { IntegrationAccount, Id, IntegrationCurrency, Numeric } from '@app/types'
import { TransferIntentModel } from './transfer-intent-model'

export interface TransferModel {
  readonly id: Id
  readonly index: number
  readonly initiator: IntegrationAccount
  readonly from: IntegrationAccount
  readonly to: IntegrationAccount
  readonly amount: Numeric
  readonly currency: IntegrationCurrency
  readonly intent: TransferIntentModel | null
}
