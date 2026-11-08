import { AbstractInteractor, Id } from '@app/types'
import { Injectable } from '@nestjs/common'
import { TxContextRunner } from '@app/shared'
import { InboxRepository } from '../../../../data/repository/inbox/inbox.repository'
import { TransactionRepository } from '../../repository/transaction/transaction.repository'
import { TransactionIntentRepository } from '../../repository/transaction-intent/transaction-intent.repository'

export interface ProcessHeldTransactionParams {
  readonly uniqueKey: string
  readonly txIds: ReadonlySet<Id>
}

@Injectable()
export class ProcessHeldTransactionInteractor extends AbstractInteractor<ProcessHeldTransactionParams, Promise<void>> {
  constructor(
    private readonly txRunner: TxContextRunner,
    private readonly inbox: InboxRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly transactionIntentRepository: TransactionIntentRepository,
  ) {
    super()
  }

  async execute(params: ProcessHeldTransactionParams): Promise<void> {
    await this.txRunner
      .create()
      .pipeline(async (ctx) => {
        const isUniqueEvent = await this.inbox.create(
          { serviceName: ProcessHeldTransactionInteractor.name, idempotencyKey: params.uniqueKey },
          ctx,
        )

        if (!isUniqueEvent) {
          return
        }

        const transactions = await this.transactionRepository.findByIds(params.txIds, ctx)

        for (const tx of transactions) {
          await this.transactionIntentRepository.markReadyForSigning(
            { sourceTxId: tx.sourceTxId, integration: tx.integration },
            ctx,
          )
        }
      })
      .execute()
  }
}
