import { AbstractInteractor, Numeric } from '@app/types'
import { Injectable } from '@nestjs/common'
import { TransferIntentRepository } from '../../../../data/repository/transfer-intent/transfer-intent.repository'
import { TransactionStatus, OutboxTxContextRunner } from '@app/shared'
import { TransactionIntentRepository } from '../../../../data/repository/transaction-intent/transaction-intent.repository'
import { OperationType } from '../../model/transfer.model'
import { TransactionEventPublisher } from '../../../../data/publisher/transaction-event/transaction-event.publisher'
import { TransactionSaverStrategy } from '../../service/transaction-saver/transaction-saver.strategy'
import { TransferRouteExecutionPlanner } from '../../service/integration/transfer-route-execution-planner.service'
import { TransferRouteRepository } from '../../../../data/repository/transfer-route/transfer-route.repository'
import { TransferRouteStatus } from '../../../../shared/model/transfer-route.model'

@Injectable()
export class CreateTransactionIntentInteractor extends AbstractInteractor<never, Promise<void>> {
  constructor(
    private readonly contextRunner: OutboxTxContextRunner,
    private readonly transferIntentRepository: TransferIntentRepository,
    private readonly transactionIntentRepository: TransactionIntentRepository,
    private readonly transferRouteExecutionPlanner: TransferRouteExecutionPlanner,
    private readonly transactionSaverStrategy: TransactionSaverStrategy,
    private readonly transactionEventPublisher: TransactionEventPublisher,
    private readonly transferRouteRepository: TransferRouteRepository,
  ) {
    super()
  }

  async execute(): Promise<void> {
    await this.contextRunner
      .create()
      .pipeline(async (ctx) => {
        const transferIntent = await this.transferIntentRepository.claimOne(ctx)

        if (!transferIntent) {
          return
        }

        const data = await this.transferRouteExecutionPlanner.execute([transferIntent])

        for (const item of data.exchanges) {
          const { routes, tx } = item

          const transactionIntent = await this.transactionIntentRepository.create(tx, ctx)
          const txIndex = routes[0].txIndex

          // We must receive the deposit ID in the event (targeting) after calling the bridge performer outside the system.
          // just for example
          // if (data.depositId) {
          //   await this.transferIntentRepository.changeDepositId(
          //     { id: singleTransfer.transferIntentId, depositId: data.depositId },
          //     ctx,
          //   )
          // }

          const transaction = await this.transactionSaverStrategy.save(
            {
              transaction: {
                executionType: transactionIntent.executionType,
                integration: transactionIntent.integration,
                sourceTxId: transactionIntent.sourceTxId,
                initiator: tx.initiator,
                blockId: null,
                blockTime: null,
                status: TransactionStatus.PREPARED,
                metadata: null,
                fee: tx.fee,
                feeCurrency: tx.feeCurrency,
                raw: JSON.stringify(transactionIntent),
                transfers: routes.map((route) => ({
                  integration: transferIntent.fromIntegration,
                  operation:
                    transferIntent.fromCurrency === 'native'
                      ? OperationType.NATIVE_TRANSFER
                      : OperationType.TOKEN_TRANSFER,
                  index: 0,
                  initiator: route.initiator,
                  from: route.fromAccount,
                  to: route.toAccount,
                  fromOwner: route.fromAccount,
                  toOwner: route.toAccount,
                  amountRaw: route.rawAmount.toFixed(Numeric.DECIMALS),
                  currency: route.currency,
                  transferIntentId: transferIntent.id,
                  metadata: null,
                })),
              },
            },
            ctx,
          )

          await this.transferRouteRepository.create(
            routes.map((route) => ({
              ...route,
              status: txIndex === 0 ? TransferRouteStatus.PENDING_HOLD : TransferRouteStatus.CREATED,
              transactionIntentId: transactionIntent.id,
              txId: transaction.id,
            })),
            ctx,
          )

          if (txIndex === 0) {
            const result = {
              ...transaction,
              transfers: transaction.transfers.map((transfer) => ({
                ...transfer,
                intent: {
                  id: transferIntent.id,
                  intentType: transferIntent.intentType,
                  intentId: transferIntent.intentId,
                },
              })),
            }

            // todo For a case with an external relay. And in general, if there are several transactions, you need to send them one at a time, waiting for the previous one to complete.
            await this.transactionEventPublisher.enqueue(result, ctx)
          }
        }
      })
      .execute()
  }
}
