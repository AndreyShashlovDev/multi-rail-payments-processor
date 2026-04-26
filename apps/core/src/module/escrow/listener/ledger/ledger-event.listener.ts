import { Injectable } from '@nestjs/common'
import { BalanceChangeType } from '@app/shared'
import { CreateEscrowInteractor } from '../../interactor/create-escrow-interactor'
import { LedgerConsumer } from '../../../../data/consumer/ledger/ledger.consumer'
import { BalanceUpdatedResult } from '../../../../data/consumer/ledger/ledger-consumer.types'

@Injectable()
export class LedgerEventListener {
  constructor(
    ledgerConsumer: LedgerConsumer,
    private readonly createEscrowInteractor: CreateEscrowInteractor,
  ) {
    ledgerConsumer.subscribeToChangeBalance({
      handler: async (data) => await this.handleEscrowBalanceChangeEvents(data),
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

  private async handleEscrowBalanceChangeEvents(data: BalanceUpdatedResult): Promise<void> {
    await this.createEscrowInteractor.execute({ data })
  }
}
