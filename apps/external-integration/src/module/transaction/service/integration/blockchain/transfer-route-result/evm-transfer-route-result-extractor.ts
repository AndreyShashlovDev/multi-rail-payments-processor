import { Injectable } from '@nestjs/common'
import { Numeric } from '@app/types'
import { TransferRouteTransferResult } from '@app/shared/services/transfer-execution/v1'
import { TransferRouteResultExtractor } from '../../../transfer-route-result/transfer-route-result-extractor'
import { TransactionModel } from '../../../../model/transaction.model'
import { TransferModel } from '../../../../model/transfer.model'

@Injectable()
export class EvmTransferRouteResultExtractor implements TransferRouteResultExtractor {
  // todo bridge step: read the deposit event from the transaction logs → BRIDGE_DEPOSIT result with depositId
  extract(transaction: TransactionModel, transfer: TransferModel): TransferRouteTransferResult {
    return new TransferRouteTransferResult(
      Numeric.create(transfer.amountRaw).toFixed(),
      transfer.currency,
      transaction.fee !== null ? Numeric.create(transaction.fee).toFixed() : null,
      transaction.feeCurrency,
    )
  }
}
