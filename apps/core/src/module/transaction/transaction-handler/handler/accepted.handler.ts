import { PayoutIntentStatus } from '../../../payout-intent/model/payout-intent.model'
import { PayoutIntentRepository } from '../../../../data/repository/payout-intent/payout-intent.repository'
import {
  IntegrationAccountLinkRepository,
} from '../../../../data/repository/integration-account-link/integration-account-link.repository'
import { TransactionModel } from '../../model/transaction.model'
import { IntentType } from '@app/shared'
import { UUID } from '@app/types'
import { TransactionHandler } from '../transaction-handler'
import { PaymentIntentRepository } from '../../../../data/repository/payment-intent/payment-intent.repository'
import { PaymentIntentStatus } from '../../../payment-intent/model/payment-intent.model'
import { TransferModel } from '../../model/transfer.model'
import { TxContext } from '@app/shared/types/tx-context.type'

export class AcceptedHandler implements TransactionHandler {
  constructor(
    private readonly payoutIntentRepository: PayoutIntentRepository,
    private readonly paymentIntentRepository: PaymentIntentRepository,
    private readonly integrationAccountLinkRepository: IntegrationAccountLinkRepository,
  ) {}

  async process(data: TransactionModel, ctx: TxContext): Promise<void> {
    const payoutTransfers = data.transfers.filter((transfer) => transfer.intent?.intentType === IntentType.PAYOUT)
    const payments = await this.paymentIntentRepository.findActiveByParams(
      {
        integration: data.integration,
        status: PaymentIntentStatus.CREATED,
        params: data.transfers.map((transfer) => ({
          to: transfer.to,
          currency: transfer.currency,
        })),
      },
      ctx,
    )

    const paymentIds = payments.map((item) => item.id)

    const payoutIds = payoutTransfers.map((transfer) => transfer.intent?.intentId as UUID)

    if (payoutIds.length > 0) {
      await this.changePayoutStatus(data, payoutTransfers, payoutIds, ctx)
    }

    if (paymentIds.length > 0) {
      await this.changePaymentStatus(paymentIds, ctx)
    }
  }

  private async changePaymentStatus(paymentIds: ReadonlyArray<UUID>, ctx: TxContext): Promise<void> {
    await this.paymentIntentRepository.markAsConfirmingBulk(new Set(paymentIds), ctx)
  }

  private async changePayoutStatus(
    transaction: TransactionModel,
    payoutTransfers: ReadonlyArray<TransferModel>,
    payoutIds: ReadonlyArray<UUID>,
    ctx: TxContext,
  ): Promise<void> {
    const accountLinks = await this.integrationAccountLinkRepository.getActive({
      integration: transaction.integration,
      accounts: new Set(payoutTransfers.map((transfer) => transfer.initiator)),
    })

    const accountLinkByAccount = new Map(accountLinks.map((link) => [link.integrationAccount.account, link]))
    const payout = await this.payoutIntentRepository.getByIds(new Set<UUID>(payoutIds))
    const payoutById = new Map(
      payout.filter((payout) => payout.status === PayoutIntentStatus.PROCESSING).map((payout) => [payout.id, payout]),
    )

    for (const transfer of payoutTransfers) {
      const payout = payoutById.get(transfer.intent?.intentId as UUID)
      const link = accountLinkByAccount.get(transfer.initiator) ?? null

      if (!payout) {
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
            : { account: transfer.initiator },
          // fee per transfer
          integrationFee: transaction.fee?.div(transaction.transfers.length) ?? null,
        },
        ctx,
      )
    }
  }
}
