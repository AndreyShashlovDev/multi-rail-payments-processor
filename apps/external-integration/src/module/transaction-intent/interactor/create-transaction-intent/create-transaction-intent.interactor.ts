import { AbstractInteractor } from '@app/types'
import { Injectable } from '@nestjs/common'
import { TransferIntentRepository } from '../../../../data/repository/transfer-intent/transfer-intent.repository'
import { TransactionStatus, OutboxTxContextRunner } from '@app/shared'
import { TransactionIntentRepository } from '../../../../data/repository/transaction-intent/transaction-intent.repository'
import { OperationType } from '../../../transaction/model/transfer.model'
import { TransactionEventPublisher } from '../../../../data/publisher/transaction-event/transaction-event.publisher'
import { TransactionSaverStrategy } from '../../../transaction/service/transaction-saver/transaction-saver.strategy'
import { TransactionBuilderStrategy } from '../../../transaction/integration/transaction-builder.strategy'

@Injectable()
export class CreateTransactionIntentInteractor extends AbstractInteractor<never, Promise<void>> {
  constructor(
    private readonly contextRunner: OutboxTxContextRunner,
    private readonly transferIntentRepository: TransferIntentRepository,
    private readonly transactionIntentRepository: TransactionIntentRepository,
    private readonly transactionBuilderStrategy: TransactionBuilderStrategy,
    private readonly transactionSaverStrategy: TransactionSaverStrategy,
    private readonly transactionEventPublisher: TransactionEventPublisher,
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

        const tx = await this.transactionBuilderStrategy.execute({
          ...transferIntent,
          integration: transferIntent.fromIntegration,
          fromAmount: transferIntent.fromRawAmount,
          toAmount: transferIntent.toRawAmount,
        })

        const transactionIntent = await this.transactionIntentRepository.create(
          {
            executionType: transferIntent.executionType,
            txId: tx.id,
            nonce: tx.rawTransaction.nonce,
            integration: transferIntent.toIntegration,
            rawData: tx.rawTransaction,
            transfers: [transferIntent],
          },
          ctx,
        )

        const transaction = await this.transactionSaverStrategy.save(
          {
            transaction: {
              executionType: transactionIntent.executionType,
              integration: transactionIntent.integration,
              sourceTxId: transactionIntent.txId,
              blockId: null,
              blockTime: null,
              status: TransactionStatus.PREPARED,
              metadata: null,
              fee: tx.estimatedFee,
              feeCurrency: tx.estimatedFeeCurrency,
              raw: JSON.stringify(transactionIntent),
              transfers: [
                {
                  integration: transferIntent.fromIntegration,
                  operation:
                    transferIntent.fromCurrency === 'native'
                      ? OperationType.NATIVE_TRANSFER
                      : OperationType.TOKEN_TRANSFER,
                  index: 0,
                  initiator: tx.executor,
                  from: transferIntent.fromAccount,
                  to: transferIntent.toAccount,
                  fromOwner: transferIntent.fromAccount,
                  toOwner: transferIntent.toAccount,
                  amountRaw: transferIntent.fromRawAmount,
                  currency: transferIntent.fromCurrency,
                  transferIntentId: transferIntent.id,
                  metadata: null,
                },
              ],
            },
          },
          ctx,
        )

        await this.transferIntentRepository.updateTransactionId(
          { id: transferIntent.id, transactionIntentId: transactionIntent.id },
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
