import { TransactionConverterResult } from '../../basic-transaction.converter'
import { PayoutPriority, PayoutConverterPriority } from '../../converter-priority.constants'
import { UUID } from '@app/types'
import { SingleIntegrationAmountPayoutOperation } from '../operation/single-integration-amount-payout.operation'
import { isUUID } from 'class-validator'
import { PlatformFeePayoutOperation } from '../operation/platform-fee-payout.operation'
import { IntegrationFeePayoutOperation } from '../operation/integration-fee-payout.operation'
import { BalanceChange } from '@app/shared/types/balance-change'
import { PayoutIntentModel, PayoutIntentStatus } from '../../../../payout-intent/model/payout-intent.model'
import { TransferModel } from '../../../model/transfer.model'
import { PayoutTransactionConverter, PayoutTransactionContext } from '../payout-transaction.converter'
import { IntentType } from '@app/shared'
import { TransactionModel } from '../../../model/transaction.model'

export class SingleIntegrationPayoutConverter implements PayoutTransactionConverter {
  readonly name: string = 'SingleIntegrationPayoutConverter'
  readonly priority: PayoutPriority = PayoutConverterPriority.SINGLE_INTEGRATION

  constructor(
    private readonly amountOperation: SingleIntegrationAmountPayoutOperation,
    private readonly platformFeeOperation: PlatformFeePayoutOperation,
    private readonly integrationFeeOperation: IntegrationFeePayoutOperation,
  ) {}

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

        if (!payout || payout.status !== PayoutIntentStatus.CONFIRMING) {
          return []
        }

        notMatchedPayout.delete(payout.id)
        notMatchedTransfers.delete(transfer.id)

        return { payout, transfer }
      })

    const changes = this.getBalanceChanges(params.transaction, matchedPayout)

    return {
      context: {
        ...params,
        payoutIntents: notMatchedPayout,
        transfers: Array.from(notMatchedTransfers.values()),
      },
      changes,
    }
  }

  private getBalanceChanges(
    tx: Pick<TransactionModel, 'id' | 'sourceTxId' | 'executedAt'>,
    matchedPayout: ReadonlyArray<{ payout: PayoutIntentModel; transfer: TransferModel }>,
  ): ReadonlyArray<BalanceChange> {
    return matchedPayout.flatMap(({ payout, transfer }) => {
      const bodyTransfer = this.amountOperation.execute({
        payout,
        tx,
        transferIds: new Set([transfer.id]),
      })

      const platformFee = this.platformFeeOperation.execute({
        payout,
        tx,
        transferIds: new Set([transfer.id]),
      })

      const integrationFee = this.integrationFeeOperation.execute({
        payout,
        tx,
        transferIds: new Set([transfer.id]),
      })

      return bodyTransfer.concat(platformFee).concat(integrationFee).flat()
    })
  }
}
