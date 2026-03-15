import { Controller } from '@nestjs/common'
import { LedgerRepository } from '../../../data/repository/ledger/ledger.repository'
import { BalanceChangeType } from '@app/shared'
import { BalanceUpdatedResult } from '../../../data/repository/ledger/ledger-repository.types'
import { CreateEscrowInteractor } from '../../../module/escrow/interactor/create-escrow-interactor'

@Controller()
export class EscrowController {
  constructor(
    ledgerRepository: LedgerRepository,
    private readonly createEscrowInteractor: CreateEscrowInteractor,
  ) {
    ledgerRepository.subscribeToChangeBalance({
      handler: async (data) => this.handleEscrowBalanceChangeEvents(data),
      filter: {
        status: new Set([
          BalanceChangeType.HOLD,
          BalanceChangeType.HOLD_IN,
          BalanceChangeType.RELEASE_HOLD_IN,
          BalanceChangeType.RELEASE_HOLD,
          BalanceChangeType.PLATFORM_FEE_ACCRUED,
        ]),
      },
    })
  }

  async handleEscrowBalanceChangeEvents(data: BalanceUpdatedResult): Promise<void> {
    await this.createEscrowInteractor.execute({ data })
  }
}
