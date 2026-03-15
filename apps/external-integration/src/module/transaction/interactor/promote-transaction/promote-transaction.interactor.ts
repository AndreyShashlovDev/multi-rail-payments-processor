import { SourceTransactionId } from '@app/types'
import { Injectable } from '@nestjs/common'
import {
  TransactionIntentRepository,
} from '../../../../data/repository/transaction-intent/transaction-intent.repository'
import { TransactionEventRepository } from '../../../../data/repository/transaction-event/transaction-event.repository'
import { TransactionRepository } from '../../../../data/repository/transaction/transaction.repository'
import { TxContextRunner, IntegrationType } from '@app/shared'
import { BasicTransactionInteractor } from '../basic-transaction.interactor'
import { TransferIntentRepository } from '../../../../data/repository/transfer-intent/transfer-intent.repository'
import { TxContext } from '@app/shared/types/tx-context.type'
import {
  TransactionIntentNotMarkAsPromotedException,
} from '../../exception/transaction-intent-not-mark-as-promoted.exception'
import { TransactionNotMarkAsPromotedException } from '../../exception/transaction-not-mark-as-promoted.exception'
import { TransactionNotFoundException } from '../../exception/transaction-not-found.exception'
import { TransactionModel } from '../../model/transaction.model'
import {
  TransferEventWithIntent,
} from '../../../../data/repository/transaction-event/transaction-event-repository.types'

export interface PromoteTransactionParams {
  readonly sourceTxId: SourceTransactionId
  readonly integration: IntegrationType
  readonly ctx: TxContext // todo remove it from Interactor. just for finalize payout example
}

@Injectable()
export class PromoteTransactionInteractor extends BasicTransactionInteractor<PromoteTransactionParams> {
  constructor(
    private readonly txRunner: TxContextRunner,
    private readonly transactionIntentRepository: TransactionIntentRepository,
    private readonly transactionEventRepository: TransactionEventRepository,
    private readonly transactionRepository: TransactionRepository,
    transferIntentRepository: TransferIntentRepository,
  ) {
    super(transferIntentRepository)
  }

  async execute({ sourceTxId, integration, ctx }: PromoteTransactionParams): Promise<void> {
    // call integration implementation for each Integration type
    const result = await this.txRunner
      .createWithData<{ tx: TransactionModel; transfers: ReadonlyArray<TransferEventWithIntent> }>(undefined, ctx)
      .pipeline(async (ctx) => {
        const updateTransactionIntent = await this.transactionIntentRepository.markPromoted(
          { txId: sourceTxId, integration },
          ctx,
        )
        const updateTransaction = await this.transactionRepository.markAsPromoted({ sourceTxId, integration }, ctx)

        if (!updateTransactionIntent) {
          throw new TransactionIntentNotMarkAsPromotedException(sourceTxId, integration)
        }

        if (!updateTransaction) {
          throw new TransactionNotMarkAsPromotedException(sourceTxId, integration)
        }

        const tx = await this.transactionRepository.getBySourceId({ sourceTxId, integration }, ctx)

        if (!tx) {
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
