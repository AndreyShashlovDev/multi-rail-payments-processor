import { AbstractInteractor } from '@app/types'
import { TransactionModel } from '../../model/transaction.model'
import { Injectable } from '@nestjs/common'
import {
  TransactionBalanceProjectorStrategy,
} from '../../transaction-balance-projector/transaction-balance-projector.strategy'
import { LedgerRepository } from '../../../../data/repository/ledger/ledger.repository'
import { InboxRepository } from '../../../../data/repository/inbox/inbox.repository'
import { TransactionHandlerStrategy } from '../../transaction-handler/transaction-handler.strategy'
import { TxContextRunner } from '@app/shared'

export interface ProcessIncomingTransactionParams {
  readonly transaction: TransactionModel
}

@Injectable()
export class ProcessIncomingTransactionInteractor extends AbstractInteractor<
  ProcessIncomingTransactionParams,
  Promise<void>
> {
  constructor(
    private readonly txRunner: TxContextRunner,
    private readonly transactionHandler: TransactionHandlerStrategy,
    private readonly balanceProjector: TransactionBalanceProjectorStrategy,
    private readonly ledgerRepository: LedgerRepository,
    private readonly inboxRepository: InboxRepository,
  ) {
    super()
  }

  async execute(params: ProcessIncomingTransactionParams): Promise<void> {
    const idempotencyKey = `${params.transaction.integration}-${params.transaction.sourceTxId}-${params.transaction.status}`

    await this.txRunner
      .create()
      .pipeline(async (ctx) => {
        const isUnique = await this.inboxRepository.create(
          { serviceName: ProcessIncomingTransactionInteractor.name, idempotencyKey },
          ctx,
        )
        if (!isUnique) {
          return
        }

        // side effects
        await this.transactionHandler.process(params.transaction, ctx)

        const changes = await this.balanceProjector.process(params.transaction, ctx)
        // we have all info by transaction with any data about payment/payout/walletAccount... Can do anything

        /*
        changes.find(event => event.metadata?.reasonStatus === 'currency_mismatch')
        changes.find(event => event.metadata?.reasonStatus === 'overpay')
        changes.find(event => event.metadata?.reasonStatus === 'underpayment')
        changes.find(event => event.metadata?.reasonStatus === 'unidentified')
        notify all
        */
        await this.ledgerRepository.changeBalance({ idempotencyKey, changes })
      })
      .execute()
  }
}
