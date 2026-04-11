import { AbstractInteractor } from '@app/types'
import { Injectable, Logger } from '@nestjs/common'
import { TransactionBalanceProjectorStrategy } from '../../../../shared/projection/transaction-balance-projector.strategy'
import { LedgerRepository } from '../../../../data/repository/ledger/ledger.repository'
import { TxContextRunner } from '@app/shared'
import { PaymentTransactionHandlerStrategy } from '../../transaction-handler/transaction-handler.module'
import { PaymentInboxTransferRepository } from '../../../../data/repository/payment-inbox-transfer/payment-inbox-transfer.repository'
import { PaymentInboxTransferModel } from '../../model/payment-inbox-transfer.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import { BalanceChange } from '@app/shared/types/balance-change'
import { randomUUID } from 'node:crypto'

interface TransferAppyResult {
  readonly success: boolean
  readonly block: boolean
  readonly balanceChanges: ReadonlyArray<BalanceChange>
}

@Injectable()
export class ProcessPaymentTransactionInteractor extends AbstractInteractor<never, Promise<void>> {
  private static RUNNING_PROCESS = false

  private readonly logger = new Logger(ProcessPaymentTransactionInteractor.name)

  constructor(
    private readonly txRunner: TxContextRunner,
    private readonly transactionHandler: PaymentTransactionHandlerStrategy,
    private readonly balanceProjector: TransactionBalanceProjectorStrategy,
    private readonly ledgerRepository: LedgerRepository,
    private readonly paymentInboxTransferRepository: PaymentInboxTransferRepository,
  ) {
    super()
  }

  async execute(): Promise<void> {
    if (ProcessPaymentTransactionInteractor.RUNNING_PROCESS) {
      this.logger.log(`Skip! ${ProcessPaymentTransactionInteractor.name} Already running!`)
      return
    }

    ProcessPaymentTransactionInteractor.RUNNING_PROCESS = true
    try {
      await this.txRunner
        .create()
        .pipeline(async (ctx) => {
          const availableKeys = await this.paymentInboxTransferRepository.findAndLockAvailableKeys(
            { integration: null },
            ctx,
          )

          if (!availableKeys.size) {
            return
          }

          const changes: BalanceChange[] = []

          const blocked = await this.paymentInboxTransferRepository.findBlocked(availableKeys, ctx)
          changes.push(...(await this.process(blocked, ctx)))

          const created = await this.paymentInboxTransferRepository.findNextCreated(availableKeys, ctx)
          changes.push(...(await this.process(created, ctx)))

          if (changes.length) {
            await this.ledgerRepository.changeBalance({ idempotencyKey: randomUUID(), changes })
          }
        })
        .execute()
    } finally {
      ProcessPaymentTransactionInteractor.RUNNING_PROCESS = false
    }
  }

  private async process(
    transfers: ReadonlyArray<PaymentInboxTransferModel>,
    ctx: TxContext,
  ): Promise<ReadonlyArray<BalanceChange>> {
    const byKey = Map.groupBy(transfers, (transfer) => transfer.key)
    const changes: BalanceChange[] = []

    for (const transfers of byKey.values()) {
      for (const transfer of transfers) {
        const result = await this.applyTransfer(transfer, ctx)

        if (result.block) {
          break
        }

        changes.push(...result.balanceChanges)
      }
    }

    return changes
  }

  private async applyTransfer(transfer: PaymentInboxTransferModel, ctx: TxContext): Promise<TransferAppyResult> {
    try {
      await this.transactionHandler.process(transfer.data, ctx)
      const result = await this.balanceProjector.process(transfer.data, ctx)

      await this.paymentInboxTransferRepository.delete({ id: transfer.id }, ctx)

      return { success: true, block: false, balanceChanges: result }
    } catch (err) {
      this.logger.error(err)

      await this.paymentInboxTransferRepository.markBlockedWithSuccessors(
        transfer.id,
        transfer.key,
        transfer.createdAt,
        err instanceof Error ? err.message : String(err),
        ctx,
      )

      return { success: false, block: true, balanceChanges: [] }
    }
  }
}
