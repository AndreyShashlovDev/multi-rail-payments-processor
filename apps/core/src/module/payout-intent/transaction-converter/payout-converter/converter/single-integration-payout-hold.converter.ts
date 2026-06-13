import { TransactionConverterResult } from '../../../../../shared/projection/basic-transaction.converter'
import { PayoutPriority, PayoutConverterPriority } from '../../converter-priority.constants'
import { UUID } from '@app/types'
import { isUUID } from 'class-validator'
import { PayoutTransactionConverter, PayoutTransactionContext } from '../payout-transaction.converter'
import { IntentType } from '@app/shared'
import { PayoutHoldsOperation } from '../operation/payout-holds.operation'

export class SingleIntegrationPayoutHoldConverter implements PayoutTransactionConverter {
  readonly name: string = 'SingleIntegrationPayoutHoldConverter'
  readonly priority: PayoutPriority = PayoutConverterPriority.SINGLE_INTEGRATION

  constructor(private readonly holdsOperation: PayoutHoldsOperation) {}

  execute(params: PayoutTransactionContext): TransactionConverterResult<PayoutTransactionContext> {
    const notMatchedPayout = new Map(params.payoutIntents)
    const notMatchedTransfers = new Map(params.transfers.map((transfer) => [transfer.id, transfer]))

    const matchedPayout = params.transfers
      .filter((transfer) => transfer.intent?.intentType === IntentType.PAYOUT)
      .flatMap((transfer) => {
        const intentId = transfer.intent?.intentId
        const validIntentId = isUUID(intentId) ? (intentId as UUID) : null

        if (!validIntentId) {
          return []
        }

        const payout = params.payoutIntents.get(validIntentId)

        if (!payout) {
          return []
        }

        notMatchedPayout.delete(payout.id)
        notMatchedTransfers.delete(transfer.id)

        const fromPlatformAccountId: UUID | null = params.platformAccountIds.has(transfer.initiator)
          ? (transfer.initiator as UUID)
          : (params.accountLinks.get(transfer.initiator)?.platformAccountId ?? null)

        const fromIntegrationAccount = params.accountLinks.get(transfer.from)?.integrationAccount.account ?? null

        return {
          payout,
          transfer,
          txInitiator: params.accountLinks.get(params.transaction.initiator) ?? null,
          from: { platformAccountId: fromPlatformAccountId, integrationAccount: fromIntegrationAccount },
        }
      })

    const changes = matchedPayout.flatMap(({ payout, transfer, txInitiator, from }) =>
      this.holdsOperation.execute({
        payout,
        tx: params.transaction,
        transfer,
        txInitiator,
        from,
      }),
    )

    return {
      context: {
        ...params,
        payoutIntents: notMatchedPayout,
        transfers: Array.from(notMatchedTransfers.values()),
      },
      changes,
    }
  }
}
