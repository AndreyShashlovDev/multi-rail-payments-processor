import { TransactionData } from '../../model/transaction.model'
import { IntegrationType } from '@app/shared'

export interface TransactionParseResult {
  readonly transaction: TransactionData
}

export interface TransactionParser<T, R extends TransactionParseResult> {
  parse(integration: IntegrationType, rawData: T): Promise<R>
}
