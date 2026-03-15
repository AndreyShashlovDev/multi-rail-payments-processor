import { SourceTransactionId } from '@app/types'
import { TransactionEventRepository } from '../../../../data/repository/transaction-event/transaction-event.repository'
import { TransactionNotFoundException } from '../../exception/transaction-not-found.exception'
import { Injectable } from '@nestjs/common'
import { BasicTransactionInteractor } from '../basic-transaction.interactor'
import { TransferIntentRepository } from '../../../../data/repository/transfer-intent/transfer-intent.repository'
import { IntegrationType, TxContextRunner } from '@app/shared'
import { TransactionRepository } from '../../../../data/repository/transaction/transaction.repository'
import { TxContext } from '@app/shared/types/tx-context.type'
import { TransactionModel } from '../../model/transaction.model'
import {
  TransferEventWithIntent,
} from '../../../../data/repository/transaction-event/transaction-event-repository.types'

export interface ConfirmTransactionParams {
  readonly sourceTxId: SourceTransactionId
  readonly integration: IntegrationType
  readonly ctx: TxContext // todo remove it from Interactor. just for finalize payout example
}

@Injectable()
export class ConfirmTransactionInteractor extends BasicTransactionInteractor<ConfirmTransactionParams> {
  constructor(
    private readonly txRunner: TxContextRunner,
    private readonly transactionRepository: TransactionRepository,
    private readonly transactionEventRepository: TransactionEventRepository,
    transferIntentRepository: TransferIntentRepository,
  ) {
    super(transferIntentRepository)
  }

  async execute({ sourceTxId, integration, ctx }: ConfirmTransactionParams): Promise<void> {
    const result = await this.txRunner
      .createWithData<{ tx: TransactionModel; transfers: ReadonlyArray<TransferEventWithIntent> }>(undefined, ctx)
      .pipeline(async (ctx) => {
        const wasUpdated = await this.transactionRepository.markAsConfirmed({ sourceTxId, integration }, ctx)
        const tx = await this.transactionRepository.getConfirmed({ sourceTxId, integration }, ctx)

        if (!wasUpdated || !tx) {
          throw new TransactionNotFoundException(sourceTxId, integration)
        }

        const transfers = await this.mergeTransfersWithTransferIntent(tx.transfers, ctx)

        return { tx, transfers }
      })
      .execute()

    await this.transactionEventRepository.publish({
      ...result.tx,
      transfers: result.transfers,
    })
  }
}
