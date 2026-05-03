import { AbstractInteractor } from '@app/types'
import { Injectable, Logger } from '@nestjs/common'
import { TransactionBalanceProjectorStrategy } from '../../../../shared/projection/transaction-balance-projector.strategy'
import { OutboxTxContextRunner } from '@app/shared'
import { BalanceChange, PayoutBalanceChangeMetadata } from '@app/shared/types/balance-change'
import { TxContext } from '@app/shared/types/tx-context.type'
import { PayoutInboxTransferRepository } from '../../../../data/repository/payout-inbox-transfer/payout-inbox-transfer.repository'
import { PayoutInboxTransferModel } from '../../model/payout-inbox-transfer.model'
import { createHash } from 'node:crypto'
import { PayoutTransactionHandlerStrategy } from '../../transaction-handler/transaction-handler.module'
import { LedgerPublisher } from '../../../../data/publisher/ledger/ledger.publisher'

interface TransferAppyResult {
  readonly success: boolean
  readonly balanceChanges: ReadonlyArray<BalanceChange<PayoutBalanceChangeMetadata>>
}

interface ProcessResult {
  readonly source: PayoutInboxTransferModel
  readonly balanceChanges: ReadonlyArray<BalanceChange<PayoutBalanceChangeMetadata>>
}

interface GroupedResult {
  readonly idempotencyKey: string
  readonly balanceChanges: ReadonlyArray<BalanceChange<PayoutBalanceChangeMetadata>>
}

@Injectable()
export class ProcessPayoutTransactionInteractor extends AbstractInteractor<never, Promise<void>> {
  private static RUNNING_PROCESS = false

  private readonly logger = new Logger(ProcessPayoutTransactionInteractor.name)

  constructor(
    private readonly txRunner: OutboxTxContextRunner,
    private readonly transactionHandler: PayoutTransactionHandlerStrategy,
    private readonly balanceProjector: TransactionBalanceProjectorStrategy,
    private readonly ledgerPublisher: LedgerPublisher,
    private readonly payoutInboxTransferRepository: PayoutInboxTransferRepository,
  ) {
    super()
  }

  async execute(): Promise<void> {
    if (ProcessPayoutTransactionInteractor.RUNNING_PROCESS) {
      this.logger.warn(`Skip! ${ProcessPayoutTransactionInteractor.name} Already running!`)
      return
    }

    ProcessPayoutTransactionInteractor.RUNNING_PROCESS = true
    try {
      await this.txRunner
        .create()
        .pipeline(async (ctx) => {
          const availableKeys = await this.payoutInboxTransferRepository.findAndLockAvailableKeys(
            { integration: null },
            ctx,
          )

          if (!availableKeys.size) {
            return
          }

          const processResults: ProcessResult[] = []

          const blocked = await this.payoutInboxTransferRepository.findBlocked(availableKeys, ctx)
          processResults.push(...(await this.process(blocked, ctx)))

          const created = await this.payoutInboxTransferRepository.findNextCreated(availableKeys, ctx)
          processResults.push(...(await this.process(created, ctx)))

          if (processResults.length > 0) {
            const groups = this.groupForPublish(processResults)

            for (const { idempotencyKey, balanceChanges } of groups) {
              if (balanceChanges.length === 0) continue

              await this.ledgerPublisher.enqueue({ idempotencyKey, changes: balanceChanges }, ctx)
            }
          }
        })
        .execute()
    } finally {
      ProcessPayoutTransactionInteractor.RUNNING_PROCESS = false
    }
  }

  private groupForPublish(results: ReadonlyArray<ProcessResult>): ReadonlyArray<GroupedResult> {
    const groupMap = new Map<
      string,
      {
        readonly idempotencyKey: string
        readonly balanceChanges: BalanceChange<PayoutBalanceChangeMetadata>[]
      }
    >()
    const groupOrder: string[] = []

    for (const { source, balanceChanges } of results) {
      for (const change of balanceChanges) {
        const groupKey = change.intentId
          ? `intent:${change.intentId}:${change.metadata.txStatus}`
          : `tx:${source.txId}:${source.transferId}:${change.metadata.txStatus}`

        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, {
            idempotencyKey: '',
            balanceChanges: [],
          })
          groupOrder.push(groupKey)
        }

        groupMap.get(groupKey)!.balanceChanges.push(change)
      }
    }

    return groupOrder.map((key) => {
      const group = groupMap.get(key)!
      return {
        ...group,
        idempotencyKey: this.buildIdempotencyKey(group.balanceChanges),
      }
    })
  }

  private buildIdempotencyKey(changes: ReadonlyArray<BalanceChange<PayoutBalanceChangeMetadata>>): string {
    const unique = new Set(
      changes.flatMap((change) =>
        change.metadata.transferIds.map(
          (id) => `${id}:${change.intentType}:${change.intentId}:${change.metadata.txId}:${change.metadata.txStatus}`,
        ),
      ),
    )

    return createHash('sha256')
      .update([...unique].sort().join(':'))
      .digest('hex')
  }

  private async process(
    transfers: ReadonlyArray<PayoutInboxTransferModel>,
    ctx: TxContext,
  ): Promise<ReadonlyArray<ProcessResult>> {
    const byKey = Map.groupBy(transfers, (transfer) => transfer.key)
    const results: ProcessResult[] = []

    for (const transfers of byKey.values()) {
      for (const transfer of transfers) {
        const result = await this.applyTransfer(transfer, ctx)

        if (!result.success) {
          break
        }

        results.push({
          source: transfer,
          balanceChanges: result.balanceChanges,
        })
      }
    }

    return results
  }

  private async applyTransfer(transfer: PayoutInboxTransferModel, ctx: TxContext): Promise<TransferAppyResult> {
    try {
      await this.transactionHandler.process(transfer.data, ctx)
      const result = await this.balanceProjector.process(transfer.data, ctx)

      await this.payoutInboxTransferRepository.delete({ id: transfer.id }, ctx)

      return { success: true, balanceChanges: result as BalanceChange<PayoutBalanceChangeMetadata>[] }
    } catch (err) {
      this.logger.error(err)

      await this.payoutInboxTransferRepository.markBlockedWithSuccessors(
        transfer.id,
        transfer.key,
        err instanceof Error ? err.message : String(err),
        ctx,
      )

      return { success: false, balanceChanges: [] }
    }
  }
}
