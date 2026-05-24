import { AbstractInteractor, Numeric } from '@app/types'
import { Injectable } from '@nestjs/common'
import { TransferIntentRepository } from '../../../../data/repository/transfer-intent/transfer-intent.repository'
import { TransactionStatus, OutboxTxContextRunner } from '@app/shared'
import { TransactionIntentRepository } from '../../../../data/repository/transaction-intent/transaction-intent.repository'
import { OperationType } from '../../model/transfer.model'
import { TransactionEventPublisher } from '../../../../data/publisher/transaction-event/transaction-event.publisher'
import { TransactionSaverStrategy } from '../../service/transaction-saver/transaction-saver.strategy'
import { TransactionBuilderStrategy } from '../../service/integration/transaction-builder.strategy'
import { TransferRouteRepository } from '../../../../data/repository/transfer-route/transfer-route.repository'
import { TransferRouteStatus } from '../../../../shared/model/transfer-route.model'

@Injectable()
export class CreateTransactionIntentInteractor extends AbstractInteractor<never, Promise<void>> {
  constructor(
    private readonly contextRunner: OutboxTxContextRunner,
    private readonly transferIntentRepository: TransferIntentRepository,
    private readonly transactionIntentRepository: TransactionIntentRepository,
    private readonly transactionBuilderStrategy: TransactionBuilderStrategy,
    private readonly transactionSaverStrategy: TransactionSaverStrategy,
    private readonly transactionEventPublisher: TransactionEventPublisher,
    private readonly transferRouteRepository: TransferRouteRepository,
  ) {
    super()
  }

  async execute(): Promise<void> {
    // make simple strategy for example. take one transfer intent and create transaction
    await this.contextRunner
      .create()
      .pipeline(async (ctx) => {
        const transferIntent = await this.transferIntentRepository.claimOne(ctx)

        if (!transferIntent) {
          return
        }

        const { tx, routes } = await this.transactionBuilderStrategy.execute([transferIntent])
        const transactionIntent = await this.transactionIntentRepository.create(tx, ctx)

        const singleTransfer = routes[0]
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
              transfers: [
                {
                  integration: transferIntent.fromIntegration,
                  operation:
                    transferIntent.fromCurrency === 'native'
                      ? OperationType.NATIVE_TRANSFER
                      : OperationType.TOKEN_TRANSFER,
                  index: 0,
                  from: singleTransfer.fromAccount,
                  to: singleTransfer.toAccount,
                  fromOwner: singleTransfer.fromAccount,
                  toOwner: singleTransfer.toAccount,
                  amountRaw: singleTransfer.rawAmount.toFixed(Numeric.DECIMALS),
                  currency: singleTransfer.currency,
                  transferIntentId: transferIntent.id,
                  metadata: null,
                },
              ],
            },
          },
          ctx,
        )

        await this.transferRouteRepository.create(
          routes.map((route) => ({
            ...route,
            status: TransferRouteStatus.CREATED,
            transactionIntentId: transactionIntent.id,
            txId: transaction.id,
          })),
          ctx,
        )

        const result = {
          ...transaction,
          transfers: [
            {
              ...transaction.transfers[0],
              intent: {
                id: transferIntent.id,
                intentType: transferIntent.intentType,
                intentId: transferIntent.intentId,
              },
            },
          ],
        }

        await this.transactionEventPublisher.enqueue(result, ctx)
      })
      .execute()
  }
}
