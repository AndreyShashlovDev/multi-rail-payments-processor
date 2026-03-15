import { AbstractInteractor } from '@app/types'
import { Injectable } from '@nestjs/common'
import { TransferIntentRepository } from '../../../../data/repository/transfer-intent/transfer-intent.repository'
import { TxContextRunner, TransactionStatus } from '@app/shared'
import {
  TransactionIntentRepository,
} from '../../../../data/repository/transaction-intent/transaction-intent.repository'
import {
  EvmSingleTransferBuilder,
} from '../../../transaction/integration/blockchain/transaction-builder/evm-single-transfer.builder'
import { OperationType } from '../../../transaction/model/transfer.model'
import { TransactionEventRepository } from '../../../../data/repository/transaction-event/transaction-event.repository'
import { TransactionEventData } from '../../../../data/repository/transaction-event/transaction-event-repository.types'
import { TransactionSaverStrategy } from '../../../transaction/service/transaction-saver/transaction-saver.strategy'

@Injectable()
export class CreateTransactionIntentInteractor extends AbstractInteractor<never, Promise<void>> {
  constructor(
    private readonly contextRunner: TxContextRunner,
    private readonly transferIntentRepository: TransferIntentRepository,
    private readonly transactionIntentRepository: TransactionIntentRepository,
    private readonly transactionBuilderStrategy: EvmSingleTransferBuilder,
    private readonly transactionSaverStrategy: TransactionSaverStrategy,
    private readonly transactionEventRepository: TransactionEventRepository,
  ) {
    super()
  }

  async execute(): Promise<void> {
    // make simple strategy for example. take one transfer intent and create transaction
    const result = await this.contextRunner
      .createWithData<TransactionEventData | null>()
      .pipeline(async (ctx) => {
        const transferIntent = await this.transferIntentRepository.claimOne(ctx)

        if (!transferIntent) {
          return null
        }

        const tx = await this.transactionBuilderStrategy.execute({
          ...transferIntent,
          fromAmount: transferIntent.fromRawAmount,
          toAmount: transferIntent.toRawAmount,
        })

        const transactionIntent = await this.transactionIntentRepository.create(
          {
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
          { id: transferIntent.id, transactionIntentId: transferIntent.id },
          ctx,
        )

        return {
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
      })
      .execute()

    if (!result) {
      return
    }

    await this.transactionEventRepository.publish(result)
  }
}
