import { IntegrationType } from '@app/shared'
import { TransferRouteResult } from '@app/shared/services/transfer-execution/v1'
import { TransferRouteResultExtractor } from './transfer-route-result-extractor'
import { TransactionModel } from '../../model/transaction.model'
import { TransferModel } from '../../model/transfer.model'

export class TransferRouteResultExtractorStrategy implements TransferRouteResultExtractor {
  constructor(private readonly extractors: ReadonlyMap<IntegrationType, TransferRouteResultExtractor>) {}

  extract(transaction: TransactionModel, transfer: TransferModel): TransferRouteResult {
    const extractor = this.extractors.get(transaction.integration)

    if (!extractor) {
      throw new Error(`Transfer route result extractor for integration ${transaction.integration} not implemented yet!`)
    }

    return extractor.extract(transaction, transfer)
  }
}
