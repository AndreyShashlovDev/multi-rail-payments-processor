import { TransactionRepository } from '../../../../../../data/repository/transaction/transaction.repository'
import { TransactionSaver } from '../../../transaction-saver/transaction-saver'
import { TransactionParseResult } from '../../../transaction-parser/transaction-parser'
import { TransactionModel } from '../../../../model/transaction.model'
import { Injectable } from '@nestjs/common'
import { TxContext } from '@app/shared/types/tx-context.type'

@Injectable()
export class EvmTransactionSaver implements TransactionSaver<TransactionParseResult> {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async save(data: TransactionParseResult, ctx?: TxContext): Promise<TransactionModel> {
    const transaction = await this.transactionRepository.save(data.transaction, ctx)

    return {
      ...transaction,
      transfers: transaction.transfers,
    }
  }
}
