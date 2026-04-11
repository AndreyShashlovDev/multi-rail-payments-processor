import { PayoutIntentRepository } from '../../../data/repository/payout-intent/payout-intent.repository'
import { UUID } from '@app/types'
import { TransferModel } from '../../../shared/model/transfer.model'
import { PayoutIntentModel } from '../model/payout-intent.model'
import { Injectable } from '@nestjs/common'
import { IntentType } from '@app/shared'
import { TxContext } from '@app/shared/types/tx-context.type'

export interface TransactionDataResult {
  readonly payouts: ReadonlyMap<UUID, PayoutIntentModel>
}

export interface LookupData {
  readonly transfers: ReadonlyArray<TransferModel>
}

@Injectable()
export class PayoutTransactionDataLoader {
  constructor(private readonly payoutIntentRepository: PayoutIntentRepository) {}

  async getLookupData(data: LookupData, ctx: TxContext): Promise<TransactionDataResult> {
    const { transfers } = data

    const payouts = await this.loadPayouts(transfers, ctx)
    const payoutsByPayoutId = new Map(payouts.map((payout) => [payout.id, payout]))

    return { payouts: payoutsByPayoutId }
  }

  private async loadPayouts(
    transfers: ReadonlyArray<TransferModel>,
    ctx: TxContext,
  ): Promise<ReadonlyArray<PayoutIntentModel>> {
    const payoutIds = new Set<UUID>(
      transfers
        .filter((transfer) => transfer.intent?.intentType === IntentType.PAYOUT)
        .map((transfer) => transfer.intent!.intentId as UUID),
    )

    if (payoutIds.size === 0) return []

    return await this.payoutIntentRepository.getByIds(payoutIds, ctx)
  }
}
