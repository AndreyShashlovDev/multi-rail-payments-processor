import { IntegrationAccount, Id, UUID } from '@app/types'

export type DestinationIntegrationAccount =
  | SourceIntegrationAccount
  | { account: IntegrationAccount; platformAccountId?: undefined; accountLinkId?: undefined }

export type SourceIntegrationAccount =
  | { account: IntegrationAccount; platformAccountId: UUID; accountLinkId?: never }
  | { account: IntegrationAccount; platformAccountId: UUID; accountLinkId: Id }
