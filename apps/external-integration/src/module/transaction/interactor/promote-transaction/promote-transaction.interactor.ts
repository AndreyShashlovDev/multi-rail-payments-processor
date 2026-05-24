import { SourceTransactionId } from '@app/types'
import { Injectable } from '@nestjs/common'
import { TransactionIntentRepository } from '../../../../data/repository/transaction-intent/transaction-intent.repository'
import { TransactionEventPublisher } from '../../../../data/publisher/transaction-event/transaction-event.publisher'
import { TransactionRepository } from '../../../../data/repository/transaction/transaction.repository'
import { IntegrationType, OutboxTxContextRunner } from '@app/shared'
import { BasicTransactionInteractor } from '../basic-transaction.interactor'
import { TransferIntentRepository } from '../../../../data/repository/transfer-intent/transfer-intent.repository'
import { TxContext } from '@app/shared/types/tx-context.type'
import { TransactionIntentNotMarkAsPromotedException } from '../../exception/transaction-intent-not-mark-as-promoted.exception'
import { TransactionNotMarkAsPromotedException } from '../../exception/transaction-not-mark-as-promoted.exception'
import { TransactionNotFoundException } from '../../exception/transaction-not-found.exception'
import { TransferIntentsNotMarkedAsProcessingException } from '../../exception/transfer-intents-not-marked-as-processing.exception'
import { TransferRouteRepository } from '../../../../data/repository/transfer-route/transfer-route.repository'

export interface PromoteTransactionParams {
  readonly sourceTxId: SourceTransactionId
  readonly integration: IntegrationType
  readonly ctx: TxContext // todo remove it from Interactor. just for finalize payout example
}

@Injectable()
export class PromoteTransactionInteractor extends BasicTransactionInteractor<PromoteTransactionParams> {
  constructor(
    private readonly txRunner: OutboxTxContextRunner,
    private readonly transactionIntentRepository: TransactionIntentRepository,
    private readonly transactionEventPublisher: TransactionEventPublisher,
    private readonly transactionRepository: TransactionRepository,
    transferIntentRepository: TransferIntentRepository,
    private readonly transferRouteRepository: TransferRouteRepository,
  ) {
    super(transferIntentRepository)
  }

  async execute({ sourceTxId, integration, ctx }: PromoteTransactionParams): Promise<void> {
    // call integration implementation for each Integration type
    await this.txRunner
      .create(ctx)
      .pipeline(async (ctx) => {
        const updatedTransactionIntentId = await this.transactionIntentRepository.markPromoted(
          { sourceTxId, integration },
          ctx,
        )

        if (!updatedTransactionIntentId) {
          throw new TransactionIntentNotMarkAsPromotedException(sourceTxId, integration)
        }

        const updateTransaction = await this.transactionRepository.markAsPromoted({ sourceTxId, integration }, ctx)

        if (!updateTransaction) {
          throw new TransactionNotMarkAsPromotedException(sourceTxId, integration)
        }

        const transferRoutes = await this.transferRouteRepository.getByTransactionIntent(
          new Set([updatedTransactionIntentId]),
          ctx,
        )

        if (transferRoutes.length === 0) {
          // todo
          throw new Error('Routes not found')
        }

        const updateTransferIntents = await this.transferIntentRepository.markAsProcessing(
          { ids: new Set(transferRoutes.map((item) => item.transferIntentId)) },
          ctx,
        )

        if (!updateTransferIntents) {
          throw new TransferIntentsNotMarkedAsProcessingException(updatedTransactionIntentId)
        }

        const tx = await this.transactionRepository.get({ sourceTxId, integration }, ctx)

        if (!tx) {
          throw new TransactionNotFoundException(sourceTxId, integration)
        }

        const transfers = await this.mergeTransfersWithTransferIntent(tx.transfers, ctx)

        const result = { ...tx, transfers }

        await this.transactionEventPublisher.enqueue(result, ctx)
      })
      .execute()
  }
}
