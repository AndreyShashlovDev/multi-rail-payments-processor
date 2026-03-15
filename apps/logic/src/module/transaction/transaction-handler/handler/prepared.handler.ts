import { TransactionHandler } from '../transaction-handler'
import { TransactionModel } from '../../model/transaction.model'
import { IntentType } from '@app/shared'
import { UUID } from '@app/types'
import { PayoutIntentRepository } from '../../../../data/repository/payout-intent/payout-intent.repository'
import {
  IntegrationAccountLinkRepository,
} from '../../../../data/repository/integration-account-link/integration-account-link.repository'
import { PayoutIntentStatus } from '../../../payout-intent/model/payout-intent.model'
import { TxContext } from '@app/shared/types/tx-context.type'

export class PreparedHandler implements TransactionHandler {
  constructor(
    private readonly payoutIntentRepository: PayoutIntentRepository,
    private readonly integrationAccountLinkRepository: IntegrationAccountLinkRepository,
  ) {}

  async process(data: TransactionModel, ctx: TxContext): Promise<void> {
    const payoutTransfers = data.transfers.filter((transfer) => transfer.intent?.intentType === IntentType.PAYOUT)
    const ids = payoutTransfers.map((transfer) => transfer.intent?.intentId as UUID)

    if (ids.length === 0) {
      return
    }

    const accountLinks = await this.integrationAccountLinkRepository.getActive(
      {
        integration: data.integration,
        accounts: new Set(payoutTransfers.map((transfer) => transfer.initiator)),
      },
      ctx,
    )

    const accountLinkByAccount = new Map(accountLinks.map((link) => [link.integrationAccount.account, link]))
    const payout = await this.payoutIntentRepository.getByIds(new Set<UUID>(ids), ctx)
    const payoutById = new Map(
      payout.filter((payout) => payout.status === PayoutIntentStatus.CREATED).map((payout) => [payout.id, payout]),
    )

    for (const transfer of payoutTransfers) {
      const payout = payoutById.get(transfer.intent?.intentId as UUID)
      const link = accountLinkByAccount.get(transfer.initiator) ?? null

      if (!payout) {
        continue
      }

      await this.payoutIntentRepository.makePrepared(
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
          integrationFee: data.fee?.div(data.transfers.length) ?? null,
        },
        ctx,
      )
    }
  }
}
