import { SourceTransactionId } from '@app/types'
import { TransactionEventPublisher } from '../../../../data/publisher/transaction-event/transaction-event.publisher'
import { TransactionNotFoundException } from '../../exception/transaction-not-found.exception'
import { Injectable } from '@nestjs/common'
import { BasicTransactionInteractor } from '../basic-transaction.interactor'
import { IntegrationType, OutboxTxContextRunner } from '@app/shared'
import { TransactionRepository } from '../../repository/transaction/transaction.repository'
import { TxContext } from '@app/shared/types/tx-context.type'
import { TransactionEventMapper } from '../transaction-event.mapper'
import { TransferRoutePublisher } from '../../../../data/publisher/transfer-route/transfer-route.publisher'
import { TransferRouteResultExtractorStrategy } from '../../service/transfer-route-result/transfer-route-result-extractor.strategy'
import { TransferRouteCompletedEvent } from '@app/shared/services/transfer-execution/v1'

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
    private readonly transactionEventPublisher: TransactionEventPublisher,
    private readonly transferRoutePublisher: TransferRoutePublisher,
    private readonly transferRouteResultExtractor: TransferRouteResultExtractorStrategy,
  ) {
    super()
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

        const result = { ...tx, transfers: this.withIntent(tx.transfers) }

        await this.transactionEventPublisher.enqueue(TransactionEventMapper.toEvent(result), ctx)

        // transfers that execute a step: report completion together with the step result to the orchestrator
        for (const transfer of tx.transfers) {
          if (transfer.transferRouteId === null) continue

          await this.transferRoutePublisher.enqueueCompleted(
            new TransferRouteCompletedEvent(
              transfer.transferRouteId,
              tx.id,
              this.transferRouteResultExtractor.extract(tx, transfer),
            ),
            ctx,
          )
        }
      })
      .execute()
  }
}
