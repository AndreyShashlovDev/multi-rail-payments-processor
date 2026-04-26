import { Injectable } from '@nestjs/common'
import { LedgerConsumer } from '../../../../data/consumer/ledger/ledger.consumer'
import { ChangePayoutStatusInteractor } from '../../interactor/change-payout-status/change-payout-status.interactor'
import { PayoutBalanceChangeMetadata } from '@app/shared/types/balance-change'
import { BalanceUpdatedResult } from '../../../../data/consumer/ledger/ledger-consumer.types'
import { IntentType } from '@app/shared'

@Injectable()
export class LedgerEventListener {
  constructor(
    readonly ledgerConsumer: LedgerConsumer,
    private readonly changePayoutStatusInteractor: ChangePayoutStatusInteractor,
  ) {
    ledgerConsumer.subscribeToChangeBalance({
      handler: async (data) =>
        await this.handlePayoutBalanceChangeEvents(data as BalanceUpdatedResult<PayoutBalanceChangeMetadata>),
      filter: { intentType: IntentType.PAYOUT },
    })
  }

  private async handlePayoutBalanceChangeEvents(
    data: BalanceUpdatedResult<PayoutBalanceChangeMetadata>,
  ): Promise<void> {
    await this.changePayoutStatusInteractor.execute({ data })
  }
}
