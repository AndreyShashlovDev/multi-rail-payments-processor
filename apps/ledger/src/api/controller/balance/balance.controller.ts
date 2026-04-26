import { Controller } from '@nestjs/common'
import { BalanceRepository } from '../../../data/repository/balance/balance.repository'
import { BalanceControllerMapper } from './balance-controller.mapper'
import { GetBalancesResponse, type GetBalancesRequest } from '@app/shared/services/ledger/v1/grpc/generated/balance'
import { LedgerController, LedgerControllerMethods } from '@app/shared/services/ledger/v1/grpc/generated/ledger'

@Controller()
@LedgerControllerMethods()
export class BalanceController implements LedgerController {
  constructor(private readonly balanceRepository: BalanceRepository) {}

  async getBalance(request: GetBalancesRequest): Promise<GetBalancesResponse> {
    const params = BalanceControllerMapper.getBalancesRequestToGetBalancesParams(request)
    const result = await this.balanceRepository.getProjectionBalances(params)

    return BalanceControllerMapper.balanceProjectionResultToGetBalancesResponse(result)
  }
}
