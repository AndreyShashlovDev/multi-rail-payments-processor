import { GetBalancesResult } from './ledger-repository.types'
import { Numeric, UUID, IntegrationCurrency, IntegrationAccount } from '@app/types'
import { GetBalancesParams, Balance, IntegrationType } from '@app/shared'
import { GetBalancesRequest, GetBalancesResponse } from '@app/shared/services/ledger/v1/grpc/generated/balance'

export class LedgerRepositoryMapper {
  static getBalancesFromDomain(params: GetBalancesParams): GetBalancesRequest {
    const platform = (params.platform ?? []).map((item) => ({
      ...item,
      currencies: Array.from(item.currencies),
    }))

    const integration = (params.integration ?? []).map((item) => ({
      ...item,
      currencies: Array.from(item.currencies),
    }))

    return { platform, integration }
  }

  static getBalancesToDomain(response: GetBalancesResponse): GetBalancesResult {
    const platform = (response.platform ?? []).reduce((acc, current) => {
      const accountId = current.accountId as UUID
      const integration = current.integration as IntegrationType

      const mapByAccount = acc.get(accountId) ?? new Map<IntegrationType, Map<IntegrationCurrency, Balance>>()
      const mapByIntegration = mapByAccount.get(integration) ?? new Map<IntegrationCurrency, Balance>()
      const balance: Balance = {
        balance: Numeric.create(current.balance),
        available: Numeric.create(current.available),
        hold: Numeric.create(current.hold),
        holdIn: Numeric.create(current.holdIn),
      }

      mapByIntegration.set(current.currency as IntegrationCurrency, balance)
      mapByAccount.set(integration, mapByIntegration)

      return acc.set(accountId, mapByAccount)
    }, new Map<UUID, Map<IntegrationType, Map<IntegrationCurrency, Balance>>>())

    const integration = (response.integration ?? []).reduce((acc, current) => {
      const account = current.account as IntegrationAccount
      const integration = current.integration as IntegrationType

      const mapByAccount = acc.get(account) ?? new Map<IntegrationType, Map<IntegrationCurrency, Balance>>()
      const mapByIntegration = mapByAccount.get(integration) ?? new Map<IntegrationCurrency, Balance>()
      const balance: Balance = {
        balance: Numeric.create(current.balance),
        available: Numeric.create(current.available),
        hold: Numeric.create(current.hold),
        holdIn: Numeric.create(current.holdIn),
      }

      mapByIntegration.set(current.currency as IntegrationCurrency, balance)
      mapByAccount.set(integration, mapByIntegration)

      return acc.set(account, mapByAccount)
    }, new Map<IntegrationAccount, Map<IntegrationType, Map<IntegrationCurrency, Balance>>>())

    return { platform, integration }
  }
}
