import { TransactionSaver } from './transaction-saver'
import { TransactionParseResult } from '../transaction-parser/transaction-parser'
import { TransactionModel } from '../../model/transaction.model'
import { IntegrationType } from '@app/shared'
import { TxContext } from '@app/shared/types/tx-context.type'

export class TransactionSaverStrategy implements TransactionSaver<TransactionParseResult> {
  constructor(private readonly savers: Map<IntegrationType, TransactionSaver<TransactionParseResult>>) {}

  async save(data: TransactionParseResult, ctx?: TxContext): Promise<TransactionModel> {
    const saver = this.savers.get(data.transaction.integration)

    if (!saver) {
      throw new Error(`Transaction saver for integration ${data.transaction.integration} not implemented yet!`)
    }

    return await saver.save(data, ctx)
  }
}
