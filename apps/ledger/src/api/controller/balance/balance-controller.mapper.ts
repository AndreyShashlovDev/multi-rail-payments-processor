import { GetBalancesParams, IntegrationType } from '@app/shared'
import { UUID, IntegrationCurrency, IntegrationAccount } from '@app/types'
import { BalanceProjectionResult } from '../../../data/repository/balance/balance-repository.types'
import { GetBalancesRequest, GetBalancesResponse } from '@app/shared/services/ledger/v1/grpc/generated/balance'

export class BalanceControllerMapper {
  static getBalancesRequestToGetBalancesParams(request: GetBalancesRequest): GetBalancesParams {
    return {
      platform: request.platform.map((item) => ({
        accountId: item.accountId as UUID,
        integration: item.integration as IntegrationType,
        currencies: new Set(item.currencies as IntegrationCurrency[]),
      })),
      integration: request.integration.map((item) => ({
        account: item.account as IntegrationAccount,
        integration: item.integration as IntegrationType,
        currencies: new Set(item.currencies as IntegrationCurrency[]),
      })),
    }
  }

  static balanceProjectionResultToGetBalancesResponse(result: BalanceProjectionResult): GetBalancesResponse {
    const platform = result.platform.map((item) => ({
      ...item,
      balance: item.balance.toString(),
      available: item.available.toString(),
      hold: item.hold.toString(),
      holdIn: item.holdIn.toString(),
    }))

    const integration = result.integration.map((item) => ({
      ...item,
      balance: item.balance.toString(),
      available: item.available.toString(),
      hold: item.hold.toString(),
      holdIn: item.holdIn.toString(),
    }))

    return {
      platform,
      integration,
    }
  }
}
