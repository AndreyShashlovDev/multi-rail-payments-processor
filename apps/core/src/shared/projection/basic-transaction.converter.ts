import { AbstractInteractor } from '@app/types'
import { TransactionContext } from './transaction-converter.engine'
import { BalanceChange } from '@app/shared/types/balance-change'

export interface TransactionConverterResult<T extends TransactionContext = TransactionContext> {
  readonly context: T
  readonly changes: ReadonlyArray<BalanceChange>
}

export interface BasicTransactionConverter<
  T extends TransactionContext = TransactionContext,
  R extends TransactionConverterResult<T> = TransactionConverterResult<T>,
> extends AbstractInteractor<T, R> {
  readonly name: string
  readonly priority: number
}
