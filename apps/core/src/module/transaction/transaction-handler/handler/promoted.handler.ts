import { TransactionHandler } from '../transaction-handler'
import { TransactionModel } from '../../model/transaction.model'
import { IntentType } from '@app/shared'
import { UUID } from '@app/types'
import { PayoutIntentRepository } from '../../../../data/repository/payout-intent/payout-intent.repository'

export class PromotedHandler implements TransactionHandler {
  constructor(private readonly payoutIntentRepository: PayoutIntentRepository) {}

  async process(data: TransactionModel): Promise<void> {
    const payoutTransfers = data.transfers.filter((transfer) => transfer.intent?.intentType === IntentType.PAYOUT)
    const ids = payoutTransfers.map((transfer) => transfer.intent?.intentId as UUID)

    if (ids.length === 0) {
      return
    }

    await this.payoutIntentRepository.markProcessing(new Set<UUID>(ids))
  }
}
