import { AbstractInteractor } from '@app/types'
import { Injectable, Logger } from '@nestjs/common'
import { TransactionBalanceProjectorStrategy } from '../../../../shared/projection/transaction-balance-projector.strategy'
import { LedgerRepository } from '../../../../data/repository/ledger/ledger.repository'
import { TxContextRunner, BalanceChangeType } from '@app/shared'
import { PaymentInboxTransferRepository } from '../../../../data/repository/payment-inbox-transfer/payment-inbox-transfer.repository'
import { PaymentInboxTransferModel } from '../../model/payment-inbox-transfer.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import { BalanceChange } from '@app/shared/types/balance-change'
import { randomUUID, UUID } from 'node:crypto'
import { PaymentIntentRepository } from '../../../../data/repository/payment-intent/payment-intent.repository'
import { PaymentAmountAccumulatorRepository } from '../../../../data/repository/payment-amount-accumulator/payment-amount-accumulator.repository'

interface TransferAppyResult {
  readonly success: boolean
  readonly balanceChanges: ReadonlyArray<BalanceChange>
}

@Injectable()
export class ProcessPaymentTransactionInteractor extends AbstractInteractor<never, Promise<void>> {
  private static RUNNING_PROCESS = false

  private readonly logger = new Logger(ProcessPaymentTransactionInteractor.name)

  constructor(
    private readonly txRunner: TxContextRunner,
    private readonly balanceProjector: TransactionBalanceProjectorStrategy,
    private readonly ledgerRepository: LedgerRepository,
    private readonly paymentInboxTransferRepository: PaymentInboxTransferRepository,
    private readonly paymentIntentRepository: PaymentIntentRepository,
    private readonly paymentAmountAccumulatorRepository: PaymentAmountAccumulatorRepository,
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
            // fixme write to outbox and fix idempotencyKey
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

        if (!result.success) {
          break
        }

        changes.push(...result.balanceChanges)
      }
    }

    return changes
  }

  private async applyTransfer(inboxTransfer: PaymentInboxTransferModel, ctx: TxContext): Promise<TransferAppyResult> {
    try {
      const result = await this.balanceProjector.process(inboxTransfer.data, ctx)

      await this.paymentInboxTransferRepository.delete({ id: inboxTransfer.id }, ctx)

      const holdInChange = result.find((item) => item.type === BalanceChangeType.HOLD_IN && item.intentId)

      if (holdInChange) {
        await this.paymentAmountAccumulatorRepository.create(
          {
            paymentId: holdInChange.intentId as UUID,
            integration: inboxTransfer.integration,
            txId: inboxTransfer.txId,
            transferId: inboxTransfer.transferId,
            amount: holdInChange.amount,
            from: inboxTransfer.data.transfers[0].from,
          },
          ctx,
        )

        await this.paymentIntentRepository.markAsProcessing(
          {
            id: holdInChange.intentId as UUID,
          },
          ctx,
        )
      }

      return { success: true, balanceChanges: result }
    } catch (err) {
      this.logger.error(err)

      await this.paymentInboxTransferRepository.markBlockedWithSuccessors(
        inboxTransfer.id,
        inboxTransfer.key,
        err instanceof Error ? err.message : String(err),
        ctx,
      )

      return { success: false, balanceChanges: [] }
    }
  }
}
