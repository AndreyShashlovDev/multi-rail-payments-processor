import { Id, IntegrationCurrency } from '@app/types'
import { IntegrationAccount } from '@app/types/integration-account'
import { IntegrationType } from '@app/shared'

export enum IntegrationAccountModelStatus {
  AVAILABLE = 'AVAILABLE', // available always for reserved address by payment
  IN_USE = 'IN_USE',
  FROZEN = 'FROZEN', // frozen by KYC etc?
  RETIRED = 'RETIRED',
}

export interface IntegrationAccountData {
  readonly integration: IntegrationType
  readonly account: IntegrationAccount
  readonly currency: IntegrationCurrency | null
  readonly status: IntegrationAccountModelStatus
  readonly custodyAccountId: Id
}

export interface IntegrationAccountModel extends IntegrationAccountData {
  readonly id: Id
  readonly createdAt: Date
  readonly updatedAt: Date
}
