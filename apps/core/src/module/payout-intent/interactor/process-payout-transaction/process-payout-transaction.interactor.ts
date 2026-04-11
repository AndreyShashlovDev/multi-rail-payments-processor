import { AbstractInteractor } from '@app/types'
import { TransactionModel } from '../../../../shared/model/transaction.model'
import { Injectable } from '@nestjs/common'
import {
  TransactionBalanceProjectorStrategy,
} from '../../../../shared/projection/transaction-balance-projector.strategy'
import { LedgerRepository } from '../../../../data/repository/ledger/ledger.repository'
import { InboxRepository } from '../../../../data/repository/inbox/inbox.repository'
import { TxContextRunner } from '@app/shared'
import { BalanceChange } from '@app/shared/types/balance-change'
import { PayoutTransactionHandlerStrategy } from '../../transaction-handler/transaction-handler.module'

export interface ProcessPayoutTransactionParams {
  readonly transaction: TransactionModel
}

@Injectable()
export class ProcessPayoutTransactionInteractor extends AbstractInteractor<
  ProcessPayoutTransactionParams,
  Promise<void>
> {
  constructor(
    private readonly txRunner: TxContextRunner,
    private readonly transactionHandler: PayoutTransactionHandlerStrategy,
    private readonly balanceProjector: TransactionBalanceProjectorStrategy,
    private readonly ledgerRepository: LedgerRepository,
    private readonly inboxRepository: InboxRepository,
  ) {
    super()
  }

  async execute(params: ProcessPayoutTransactionParams): Promise<void> {
    const idempotencyKey = `payout-${params.transaction.integration}-${params.transaction.sourceTxId}-${params.transaction.status}`

    const changes = await this.txRunner
      .createWithData<ReadonlyArray<BalanceChange> | null>()
      .pipeline(async (ctx) => {
        const isUnique = await this.inboxRepository.create(
          { serviceName: ProcessPayoutTransactionInteractor.name, idempotencyKey },
          ctx,
        )

        if (!isUnique) {
          return null
        }

        // side effects
        await this.transactionHandler.process(params.transaction, ctx)

        return await this.balanceProjector.process(params.transaction, ctx)
      })
      .execute()

    if (changes) {
      await this.ledgerRepository.changeBalance({ idempotencyKey, changes })
    }
  }
}
