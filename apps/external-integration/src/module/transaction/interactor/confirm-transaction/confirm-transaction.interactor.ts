import { SourceTransactionId } from '@app/types'
import { TransactionEventPublisher } from '../../../../data/publisher/transaction-event/transaction-event.publisher'
import { TransactionNotFoundException } from '../../exception/transaction-not-found.exception'
import { Injectable } from '@nestjs/common'
import { BasicTransactionInteractor } from '../basic-transaction.interactor'
import { TransferIntentRepository } from '../../../../data/repository/transfer-intent/transfer-intent.repository'
import { IntegrationType, OutboxTxContextRunner } from '@app/shared'
import { TransactionRepository } from '../../../../data/repository/transaction/transaction.repository'
import { TxContext } from '@app/shared/types/tx-context.type'

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
    transferIntentRepository: TransferIntentRepository,
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

        const transfers = await this.mergeTransfersWithTransferIntent(tx.transfers, ctx)

        const result = { ...tx, transfers }

        await this.transactionEventPublisher.enqueue(result, ctx)
      })
      .execute()
  }
}
