import { AbstractInteractor, IntegrationAccount } from '@app/types'
import { Injectable } from '@nestjs/common'
import { TransferIntentRepository } from '../../../../data/repository/transfer-intent/transfer-intent.repository'
import { TransactionStatus, OutboxTxContextRunner, ExecutionType } from '@app/shared'
import { TransactionIntentRepository } from '../../../../data/repository/transaction-intent/transaction-intent.repository'
import { OperationType } from '../../../transaction/model/transfer.model'
import { TransactionEventPublisher } from '../../../../data/publisher/transaction-event/transaction-event.publisher'
import { TransactionSaverStrategy } from '../../../transaction/service/transaction-saver/transaction-saver.strategy'
import { TransactionBuilderStrategy } from '../../../transaction/integration/transaction-builder.strategy'
import { IntegrationAccountRepository } from '../../../../data/repository/integration-account/integration-account.repository'
import { RelayerStrategy } from '../../relayer/relayer.strategy'

@Injectable()
export class CreateTransactionIntentInteractor extends AbstractInteractor<never, Promise<void>> {
  constructor(
    private readonly contextRunner: OutboxTxContextRunner,
    private readonly transferIntentRepository: TransferIntentRepository,
    private readonly transactionIntentRepository: TransactionIntentRepository,
    private readonly transactionBuilderStrategy: TransactionBuilderStrategy,
    private readonly transactionSaverStrategy: TransactionSaverStrategy,
    private readonly transactionEventPublisher: TransactionEventPublisher,
    private readonly integrationAccountRepository: IntegrationAccountRepository,
    private readonly relayerStrategy: RelayerStrategy,
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
        const platformAccounts = (
          await this.integrationAccountRepository.hasAccounts({
            accounts: new Set([transferIntent.fromAccount, transferIntent.toAccount]),
          })
        ).existing

        const executionType =
          platformAccounts.has(transferIntent.fromAccount) && platformAccounts.has(transferIntent.toAccount)
            ? ExecutionType.INTERNAL
            : ExecutionType.NATIVE

        let fromAccount: IntegrationAccount | null = transferIntent.fromAccount

        if (executionType === ExecutionType.NATIVE) {
          fromAccount = await this.relayerStrategy.getAccount({
            from: transferIntent.fromAccount,
            to: transferIntent.toAccount,
            fromIntegration: transferIntent.fromIntegration,
            toIntegration: transferIntent.toIntegration,
            fromCurrency: transferIntent.fromCurrency,
            toCurrency: transferIntent.toCurrency,
            fromAmount: transferIntent.fromRawAmount,
            toAmount: transferIntent.toRawAmount,
            platformAccounts,
          })
        }

        if (!fromAccount) {
          throw new Error('fromAccount is undefined!')
        }

        const tx = await this.transactionBuilderStrategy.execute({
          ...transferIntent,
          executionType,
          fromAccount,
          integration: transferIntent.fromIntegration,
          fromAmount: transferIntent.fromRawAmount,
          toAmount: transferIntent.toRawAmount,
        })

        const transactionIntent = await this.transactionIntentRepository.create(
          {
            executionType,
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
                  from: fromAccount,
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
