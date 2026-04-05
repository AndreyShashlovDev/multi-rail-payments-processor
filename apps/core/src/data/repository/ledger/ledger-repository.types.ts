import { BalanceChange, BasicBalanceChangeMetadata, BalanceChangeMetadata } from '@app/shared/types/balance-change'
import { IntegrationCurrency, UUID, IntegrationAccount } from '@app/types'
import { Balance, IntegrationType } from '@app/shared'

export interface ChangeBalanceData {
  readonly idempotencyKey: string
  readonly changes: ReadonlyArray<BalanceChange>
}

export interface BalanceUpdatedResult<T extends BasicBalanceChangeMetadata = BalanceChangeMetadata> {
  readonly idempotencyKey: string
  readonly ver: number
  readonly changes: ReadonlyArray<BalanceChange<T>>
}

export interface GetBalancesResult {
  readonly platform: Map<UUID, Map<IntegrationType, Map<IntegrationCurrency, Balance>>>
  readonly integration: Map<IntegrationAccount, Map<IntegrationType, Map<IntegrationCurrency, Balance>>>
}
