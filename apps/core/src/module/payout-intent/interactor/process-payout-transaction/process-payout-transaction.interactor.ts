import { AbstractInteractor } from '@app/types'
import { Injectable, Logger } from '@nestjs/common'
import { TransactionBalanceProjectorStrategy } from '../../../../shared/projection/transaction-balance-projector.strategy'
import { LedgerRepository } from '../../../../data/repository/ledger/ledger.repository'
import { TxContextRunner } from '@app/shared'
import { BalanceChange } from '@app/shared/types/balance-change'
import { TxContext } from '@app/shared/types/tx-context.type'
import { PayoutInboxTransferRepository } from '../../../../data/repository/payout-inbox-transfer/payout-inbox-transfer.repository'
import { PayoutInboxTransferModel } from '../../model/payout-inbox-transfer.model'
import { randomUUID } from 'node:crypto'
import { PayoutTransactionHandlerStrategy } from '../../transaction-handler/transaction-handler.module'

interface TransferAppyResult {
  readonly success: boolean
  readonly balanceChanges: ReadonlyArray<BalanceChange>
}

@Injectable()
export class ProcessPayoutTransactionInteractor extends AbstractInteractor<never, Promise<void>> {
  private static RUNNING_PROCESS = false

  private readonly logger = new Logger(ProcessPayoutTransactionInteractor.name)

  constructor(
    private readonly txRunner: TxContextRunner,
    private readonly transactionHandler: PayoutTransactionHandlerStrategy,
    private readonly balanceProjector: TransactionBalanceProjectorStrategy,
    private readonly ledgerRepository: LedgerRepository,
    private readonly payoutInboxTransferRepository: PayoutInboxTransferRepository,
  ) {
    super()
  }

  async execute(): Promise<void> {
    if (ProcessPayoutTransactionInteractor.RUNNING_PROCESS) {
      this.logger.log(`Skip! ${ProcessPayoutTransactionInteractor.name} Already running!`)
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

          const changes: BalanceChange[] = []

          const blocked = await this.payoutInboxTransferRepository.findBlocked(availableKeys, ctx)
          changes.push(...(await this.process(blocked, ctx)))

          const created = await this.payoutInboxTransferRepository.findNextCreated(availableKeys, ctx)
          changes.push(...(await this.process(created, ctx)))

          if (changes.length) {
            // fixme write to outbox and fix idempotencyKey
            await this.ledgerRepository.changeBalance({ idempotencyKey: randomUUID(), changes })
          }
        })
        .execute()
    } finally {
      ProcessPayoutTransactionInteractor.RUNNING_PROCESS = false
    }
  }

  private async process(
    transfers: ReadonlyArray<PayoutInboxTransferModel>,
    ctx: TxContext,
  ): Promise<ReadonlyArray<BalanceChange>> {
    const byKey = Map.groupBy(transfers, (transfer) => transfer.key)
    const changes: BalanceChange[] = []

    for (const transfers of byKey.values()) {
      for (const transfer of transfers) {
        const result = await this.applyTransfer(transfer, ctx)

        if (!result.success) {
          break
        }

        changes.push(...result.balanceChanges)
      }
    }

    return changes
  }

  private async applyTransfer(transfer: PayoutInboxTransferModel, ctx: TxContext): Promise<TransferAppyResult> {
    try {
      await this.transactionHandler.process(transfer.data, ctx)
      const result = await this.balanceProjector.process(transfer.data, ctx)

      await this.payoutInboxTransferRepository.delete({ id: transfer.id }, ctx)

      return { success: true, balanceChanges: result }
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
