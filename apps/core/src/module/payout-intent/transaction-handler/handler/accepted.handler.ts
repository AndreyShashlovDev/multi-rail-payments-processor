import { PayoutIntentStatus } from '../../model/payout-intent.model'
import { PayoutIntentRepository } from '../../../../data/repository/payout-intent/payout-intent.repository'
import { IntegrationAccountLinkRepository } from '../../../../data/repository/integration-account-link/integration-account-link.repository'
import { TransactionModel } from '../../../../shared/model/transaction.model'
import { IntentType } from '@app/shared'
import { UUID } from '@app/types'
import { TransactionHandler } from '../../../../shared/transaction-handler/transaction-handler'
import { TransferModel } from '../../../../shared/model/transfer.model'
import { TxContext } from '@app/shared/types/tx-context.type'

export class AcceptedHandler implements TransactionHandler {
  constructor(
    private readonly payoutIntentRepository: PayoutIntentRepository,
    private readonly integrationAccountLinkRepository: IntegrationAccountLinkRepository,
  ) {}

  async process(data: TransactionModel, ctx: TxContext): Promise<void> {
    const payoutTransfers = data.transfers.filter((transfer) => transfer.intent?.intentType === IntentType.PAYOUT)
    const payoutIds = payoutTransfers.map((transfer) => transfer.intent?.intentId as UUID)

    if (payoutIds.length > 0) {
      await this.changePayoutStatus(data, payoutTransfers, payoutIds, ctx)
    }
  }

  private async changePayoutStatus(
    transaction: TransactionModel,
    payoutTransfers: ReadonlyArray<TransferModel>,
    payoutIds: ReadonlyArray<UUID>,
    ctx: TxContext,
  ): Promise<void> {
    const accountLinks = await this.integrationAccountLinkRepository.getActive({
      integration: transaction.integration,
      accounts: new Set([transaction.initiator]),
    })

    const accountLinkByAccount = new Map(accountLinks.map((link) => [link.integrationAccount.account, link]))
    const payout = await this.payoutIntentRepository.getByIds(new Set<UUID>(payoutIds))
    const payoutById = new Map(
      payout.filter((payout) => payout.status === PayoutIntentStatus.PROCESSING).map((payout) => [payout.id, payout]),
    )

    for (const transfer of payoutTransfers) {
      const payout = payoutById.get(transfer.intent?.intentId as UUID)
      const link = accountLinkByAccount.get(transaction.initiator) ?? null

      if (!payout) {
        continue
      }

      const isFinalTransfer = transaction.transfers.some(
        (item) => item.to === payout.to.account && payout.toIntegration === transaction.integration,
      )

      if (!isFinalTransfer) {
        continue
      }

      await this.payoutIntentRepository.makeConfirming(
        {
          id: payout.id,
          integrationFeePayer: link
            ? {
                account: link.integrationAccount.account,
                platformAccountId: link.platformAccountId,
                accountLinkId: link.id,
              }
            : { account: transaction.initiator },
          // fee per transfer
          // todo should make plus
          integrationFee: transaction.fee?.div(transaction.transfers.length) ?? null,
        },
        ctx,
      )
    }
  }
}
