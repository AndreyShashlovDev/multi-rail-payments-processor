import { SourceTransactionId } from '@app/types'
import { TransactionEventPublisher } from '../../../../data/publisher/transaction-event/transaction-event.publisher'
import { TransactionNotFoundException } from '../../exception/transaction-not-found.exception'
import { Injectable } from '@nestjs/common'
import { BasicTransactionInteractor } from '../basic-transaction.interactor'
import { TransferIntentRepository } from '../../../../data/repository/transfer-intent/transfer-intent.repository'
import { IntegrationType, OutboxTxContextRunner } from '@app/shared'
import { TransactionRepository } from '../../../../data/repository/transaction/transaction.repository'
import { TxContext } from '@app/shared/types/tx-context.type'
import { TransferRouteRepository } from '../../../../data/repository/transfer-route/transfer-route.repository'
import { TransactionEventData } from '../../../../data/publisher/transaction-event/transaction-event-publisher.types'

export interface ConfirmTransactionParams {
  readonly sourceTxId: SourceTransactionId
  readonly integration: IntegrationType
  readonly ctx: TxContext // todo remove it from Interactor. just for finalize payout example
}

@Injectable()
export class ConfirmTransactionInteractor extends BasicTransactionInteractor<ConfirmTransactionParams> {
  constructor(
    private readonly txRunner: OutboxTxContextRunner,
    private readonly transactionRepository: TransactionRepository,
    transferIntentRepository: TransferIntentRepository,
    private readonly transferRouteRepository: TransferRouteRepository,
    private readonly transactionEventPublisher: TransactionEventPublisher,
  ) {
    super(transferIntentRepository)
  }

  async execute({ sourceTxId, integration, ctx }: ConfirmTransactionParams): Promise<void> {
    await this.txRunner
      .create(ctx)
      .pipeline(async (ctx) => {
        const wasUpdated = await this.transactionRepository.markAsConfirmed({ sourceTxId, integration }, ctx)
        const tx = await this.transactionRepository.getConfirmed({ sourceTxId, integration }, ctx)

        if (!wasUpdated || !tx) {
          throw new TransactionNotFoundException(sourceTxId, integration)
        }

        const completedRoutes = await this.transferRouteRepository.markAsCompleted(tx.id, ctx)

        if (!completedRoutes) {
          // todo
          throw new Error(`No one routes not completed for tx id: ${tx.id}`)
        }

        const completedTransferIntent = await this.transferRouteRepository.getFullyCompletedIntentIdByTxId(tx.id, ctx)

        if (completedTransferIntent) {
          const changedCompletedIntent = await this.transferIntentRepository.markAsCompleted(
            { id: completedTransferIntent.transferIntentId },
            ctx,
          )

          if (!changedCompletedIntent) {
            throw new Error(
              `Transfer intent not marked as Completed! transfer intent id: ${completedTransferIntent.transferIntentId}`,
            )
          }
        }

        const transfers = await this.mergeTransfersWithTransferIntent(tx.transfers, ctx)

        const result: TransactionEventData[] = [{ ...tx, transfers }]

        // send next tx of transfer intent
        if (!completedTransferIntent) {
          const nextRoutes = await this.transferRouteRepository.claimNextPendingRoutesByTxId(tx.id, ctx)

          if (nextRoutes.length > 0) {
            const transactionIntentIds = new Set(nextRoutes.map((r) => r.transactionIntentId!))
            const nextTransactions = await this.transactionRepository.findByIds(transactionIntentIds, ctx)

            for (const nextTx of nextTransactions) {
              const transfers = await this.mergeTransfersWithTransferIntent(nextTx.transfers, ctx)
              result.push({ ...nextTx, transfers })
            }
          }
        }

        for (const event of result) {
          await this.transactionEventPublisher.enqueue(event, ctx)
        }
      })
      .execute()
  }
}
