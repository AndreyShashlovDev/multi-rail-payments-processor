import { Controller } from '@nestjs/common'
import { BalanceEventRepository } from '../../../data/repository/balance-event/balance-event-repository'
import { BalanceChangeEvent } from '../../../data/repository/balance-event/balance-event-repository.types'
import {
  ProcessApplyBalanceInteractor,
} from '../../../module/balance/interactor/process-apply-balance/process-apply-balance.interactor'
import { BalanceRepository } from '../../../data/repository/balance/balance.repository'
import { BalanceControllerMapper } from './balance-controller.mapper'
import { GetBalancesResponse, type GetBalancesRequest } from '@app/shared/services/ledger/v1/grpc/generated/balance'
import { LedgerController, LedgerControllerMethods } from '@app/shared/services/ledger/v1/grpc/generated/ledger'

@Controller()
@LedgerControllerMethods()
export class BalanceController implements LedgerController {
  constructor(
    balanceEventRepository: BalanceEventRepository,
    private readonly processApplyBalanceInteractor: ProcessApplyBalanceInteractor,
    private readonly balanceRepository: BalanceRepository,
  ) {
    balanceEventRepository.subscribeToBalanceChangeEvent({
      handler: async (event) => await this.handleBalanceChange(event),
    })
  }

  private async handleBalanceChange(event: BalanceChangeEvent): Promise<void> {
    await this.processApplyBalanceInteractor.execute({
      uniqueKey: event.uniqueKey,
      changes: event.changes,
    })
  }

  async getBalance(request: GetBalancesRequest): Promise<GetBalancesResponse> {
    const params = BalanceControllerMapper.getBalancesRequestToGetBalancesParams(request)
    const result = await this.balanceRepository.getProjectionBalances(params)

    return BalanceControllerMapper.balanceProjectionResultToGetBalancesResponse(result)
  }
}
