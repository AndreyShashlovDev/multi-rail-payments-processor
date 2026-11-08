import { AbstractInteractor, IntegrationAccount, IntegrationCurrency, RawNumeric } from '@app/types'
import { Injectable } from '@nestjs/common'
import { InternalEvmSingleTransferBuilder } from './internal/blockchain/transaction-builder/internal-evm-single-transfer.builder'
import { EvmSingleTransferBuilder } from './blockchain/transaction-builder/evm-single-transfer.builder'
import { ExecutionType, IntegrationType } from '@app/shared'
import { TransactionIntentData } from '../../model/transaction-intent.model'

export interface TransferRouteTransactionParams {
  readonly integration: IntegrationType
  readonly executionType: ExecutionType
  // the account that executes (signs) the step transaction
  readonly from: IntegrationAccount
  readonly to: IntegrationAccount
  readonly currency: IntegrationCurrency
  readonly rawAmount: RawNumeric
}

// Builds the transaction of a single step (transfer route).
@Injectable()
export class TransferRouteTransactionBuilder extends AbstractInteractor<
  TransferRouteTransactionParams,
  Promise<TransactionIntentData>
> {
  constructor(
    private readonly evmSingleTransferBuilder: EvmSingleTransferBuilder,
    private readonly internalEvmSingleTransferBuilder: InternalEvmSingleTransferBuilder,
  ) {
    super()
  }

  async execute(route: TransferRouteTransactionParams): Promise<TransactionIntentData> {
    const amount = route.rawAmount

    const transferBuilderParams = {
      integration: route.integration,
      fromAccount: route.from,
      fromAmount: amount,
      fromCurrency: route.currency,
      toAccount: route.to,
      toAmount: amount,
      toCurrency: route.currency,
    }

    const txSingleTransfer = await (route.executionType === ExecutionType.INTERNAL
      ? this.internalEvmSingleTransferBuilder.execute(transferBuilderParams)
      : this.evmSingleTransferBuilder.execute(transferBuilderParams))

    return {
      executionType: route.executionType,
      initiator: route.from,
      sourceTxId: txSingleTransfer.id,
      integration: route.integration,
      fee: txSingleTransfer.estimatedFee,
      feeCurrency: txSingleTransfer.estimatedFeeCurrency,
      rawData: txSingleTransfer.rawTransaction,
    }
  }
}
