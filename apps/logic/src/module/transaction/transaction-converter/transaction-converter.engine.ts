import { BasicTransactionConverter } from './basic-transaction.converter'
import { BalanceChange } from '@app/shared/types/balance-change'
import { Logger } from '@nestjs/common'
import { TransactionModel } from '../model/transaction.model'
import { TransferModel } from '../model/transfer.model'

export interface TransactionContext {
  readonly transaction: Omit<TransactionModel, 'transfers'>
  readonly transfers: ReadonlyArray<TransferModel>
}

export class TransactionConverterEngine<T extends TransactionContext = TransactionContext> {
  private readonly sortedMatchers: ReadonlyArray<BasicTransactionConverter>

  constructor(
    matchers: ReadonlyArray<BasicTransactionConverter>,
    private readonly logger: Logger,
  ) {
    const priorities = matchers.map((matcher) => matcher.priority)
    const uniquePriorities = new Set(priorities)

    if (priorities.length !== uniquePriorities.size) {
      throw new Error('Duplicate matcher priorities detected!')
    }

    this.sortedMatchers = matchers.toSorted((a, b) => b.priority - a.priority)
  }

  async process(context: T): Promise<ReadonlyArray<BalanceChange>> {
    const allChanges: BalanceChange[] = []
    let currentContext = context

    if (context.transfers.length === 0) {
      throw new Error('Unexpected transaction without transfers!')
    }

    for (const matcher of this.sortedMatchers) {
      if (currentContext.transfers.length === 0) {
        break
      }

      const result = matcher.execute(currentContext)
      currentContext = result.context as T

      this.logger.log(`Apply matcher ${matcher.name}`)
      allChanges.push(...result.changes)
    }

    return allChanges
  }
}
