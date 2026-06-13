import { TransactionConverterResult } from '../../../../../shared/projection/basic-transaction.converter'
import { PayoutPriority, PayoutConverterPriority } from '../../converter-priority.constants'
import { UUID, IntegrationAccount } from '@app/types'
import { SingleIntegrationAmountPayoutOperation } from '../operation/single-integration-amount-payout.operation'
import { isUUID } from 'class-validator'
import { PlatformFeePayoutOperation } from '../operation/platform-fee-payout.operation'
import { IntegrationFeePayoutOperation } from '../operation/integration-fee-payout.operation'
import { BalanceChange } from '@app/shared/types/balance-change'
import { PayoutIntentModel } from '../../../model/payout-intent.model'
import { TransferModel } from '../../../../../shared/model/transfer.model'
import { PayoutTransactionConverter, PayoutTransactionContext } from '../payout-transaction.converter'
import { IntentType } from '@app/shared'
import { TransactionModel } from '../../../../../shared/model/transaction.model'
import { IntegrationAccountLinkModel } from '../../../../../shared/model/integration-account-link.model'

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
    tx: Omit<TransactionModel, 'transfers'>,
    matchedPayout: ReadonlyArray<{
      payout: PayoutIntentModel
      transfer: TransferModel
      txInitiator: IntegrationAccountLinkModel | null
      from: { platformAccountId: UUID | null; integrationAccount: IntegrationAccount | null } // all null is from bridge tx
    }>,
  ): ReadonlyArray<BalanceChange> {
    return matchedPayout.flatMap(({ payout, transfer, txInitiator, from }) => {
      const transferIds = new Set([transfer.id])

      const amount = this.amountOperation.execute({ payout, tx, transfer, transferIds, from })
      const platformFee = this.platformFeeOperation.execute({
        payout,
        tx,
        transferIds,
        from,
      })

      const integrationFee =
        (transfer.to === payout.to.account || transfer.to === payout.to.platformAccountId) &&
        tx.integration === payout.toIntegration
          ? this.integrationFeeOperation.execute({
              payout,
              tx,
              transfer,
              transferIds,
              txInitiator,
            })
          : []

      return amount.concat(platformFee).concat(integrationFee).flat()
    })
  }
}
