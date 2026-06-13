import { PayoutIntentRepository } from '../../../data/repository/payout-intent/payout-intent.repository'
import { UUID, IntegrationAccount } from '@app/types'
import { TransferModel } from '../../../shared/model/transfer.model'
import { PayoutIntentModel } from '../model/payout-intent.model'
import { Injectable } from '@nestjs/common'
import { IntentType, IntegrationType } from '@app/shared'
import { TxContext } from '@app/shared/types/tx-context.type'
import { TransactionModel } from '../../../shared/model/transaction.model'
import { IntegrationAccountLinkRepository } from '../../../data/repository/integration-account-link/integration-account-link.repository'
import { isUUID } from 'class-validator'
import { IntegrationAccountLinkModel } from '../../../shared/model/integration-account-link.model'
import { IntegrationAccountRepository } from '../../../data/repository/integration-account/integration-account.repository'

export interface TransactionDataResult {
  readonly payouts: ReadonlyMap<UUID, PayoutIntentModel>
  readonly platformAccountIds: ReadonlySet<IntegrationAccount>
  readonly accountLinks: ReadonlyMap<IntegrationAccount, IntegrationAccountLinkModel>
}

export interface LookupData {
  readonly transaction: Pick<TransactionModel, 'integration' | 'executionType' | 'initiator'>
  readonly transfers: ReadonlyArray<TransferModel>
}

@Injectable()
export class PayoutTransactionDataLoader {
  constructor(
    private readonly payoutIntentRepository: PayoutIntentRepository,
    private readonly integrationAccountRepository: IntegrationAccountRepository,
    private readonly integrationAccountLinkRepository: IntegrationAccountLinkRepository,
  ) {}

  async getLookupData(data: LookupData, ctx: TxContext): Promise<TransactionDataResult> {
    const { transaction, transfers } = data

    const payouts = await this.loadPayouts(transfers, ctx)
    const platformAccountIds = await this.loadPlatformAccounts(transfers, ctx)
    const accountLinks = await this.loadIntegrationAccountLinksAccounts(
      transaction.integration,
      transaction.initiator,
      transfers,
      ctx,
    )

    return {
      payouts: new Map(payouts.map((payout) => [payout.id, payout])),
      platformAccountIds,
      accountLinks,
    }
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

  private async loadPlatformAccounts(
    transfers: ReadonlyArray<TransferModel>,
    ctx: TxContext,
  ): Promise<ReadonlySet<IntegrationAccount>> {
    const accounts = new Set(transfers.flatMap((item) => [item.initiator, item.from]).filter((item) => isUUID(item)))

    if (!accounts.size) {
      return new Set()
    }

    return (await this.integrationAccountRepository.hasAccounts({ accounts }, ctx)).existing
  }

  private async loadIntegrationAccountLinksAccounts(
    integration: IntegrationType,
    txExecutor: IntegrationAccount,
    transfers: ReadonlyArray<TransferModel>,
    ctx: TxContext,
  ): Promise<ReadonlyMap<IntegrationAccount, IntegrationAccountLinkModel>> {
    const accounts = new Set(transfers.flatMap((item) => [item.initiator, item.from, txExecutor]))

    if (!accounts.size) {
      return new Map()
    }

    const result = await this.integrationAccountLinkRepository.getActive({ integration, accounts }, ctx)

    return new Map(result.map((item) => [item.integrationAccount.account, item]))
  }
}
