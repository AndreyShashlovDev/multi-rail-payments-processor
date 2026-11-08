import { TransferRouteResult } from '@app/shared/services/transfer-execution/v1'
import { TransactionModel } from '../../model/transaction.model'
import { TransferModel } from '../../model/transfer.model'

// Builds the result of a completed step from its confirmed transaction. The place to read what the
// orchestrator needs for the next step, e.g. a bridge depositId from the transaction logs.
export interface TransferRouteResultExtractor {
  extract(transaction: TransactionModel, transfer: TransferModel): TransferRouteResult
}
