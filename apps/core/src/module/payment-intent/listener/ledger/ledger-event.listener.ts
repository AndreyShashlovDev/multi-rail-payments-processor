import { Logger, Injectable } from '@nestjs/common'
import { LedgerConsumer } from '../../../../data/consumer/ledger/ledger.consumer'
import { ChangePaymentStatusInteractor } from '../../interactor/change-payment-status/change-payment-status.interactor'
import { BalanceUpdatedResult } from '../../../../data/consumer/ledger/ledger-consumer.types'
import { PaymentBalanceChangeMetadata } from '@app/shared/types/balance-change'
import { IntentType, BalanceChangeType } from '@app/shared'

@Injectable()
export class LedgerEventListener {
  private readonly logger = new Logger(LedgerEventListener.name)

  constructor(
    readonly ledgerConsumer: LedgerConsumer,
    private readonly changePaymentStatusInteractor: ChangePaymentStatusInteractor,
  ) {
    ledgerConsumer.subscribeToChangeBalance({
      handler: async (data) =>
        await this.handlePaymentBalanceChangeEvents(data as BalanceUpdatedResult<PaymentBalanceChangeMetadata>),
      filter: {
        intentType: IntentType.PAYMENT,
        status: new Set([BalanceChangeType.CREDIT, BalanceChangeType.HOLD, BalanceChangeType.HOLD_IN]),
      },
    })
  }

  private async handlePaymentBalanceChangeEvents(
    data: BalanceUpdatedResult<PaymentBalanceChangeMetadata>,
  ): Promise<void> {
    await this.changePaymentStatusInteractor.execute({ data })
  }
}
