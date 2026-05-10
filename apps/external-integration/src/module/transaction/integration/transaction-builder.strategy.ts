import {
  AbstractInteractor,
  IntegrationAccount,
  RawNumeric,
  type IntegrationCurrency,
  SourceTransactionId,
} from '@app/types'
import { Injectable } from '@nestjs/common'
import { InternalEvmSingleTransferBuilder } from './internal/blockchain/transaction-builder/internal-evm-single-transfer.builder'
import { EvmSingleTransferBuilder, EvmTransaction } from './blockchain/transaction-builder/evm-single-transfer.builder'
import { IntegrationType, ExecutionType } from '@app/shared'

export type TransactionBuilderType = SingleTransferParams

export interface SingleTransferParams {
  readonly executionType: ExecutionType
  readonly integration: IntegrationType
  readonly fromAccount: IntegrationAccount
  readonly fromAmount: RawNumeric
  readonly fromCurrency: IntegrationCurrency
  readonly toAccount: IntegrationAccount
  readonly toAmount: RawNumeric
  readonly toCurrency: IntegrationCurrency
}

export interface SingleTransferResult {
  readonly id: SourceTransactionId
  readonly executor: IntegrationAccount
  readonly estimatedFeeCurrency: IntegrationCurrency
  readonly estimatedFee: RawNumeric
  readonly rawTransaction: EvmTransaction
}

@Injectable()
export class TransactionBuilderStrategy extends AbstractInteractor<
  TransactionBuilderType,
  Promise<SingleTransferResult>
> {
  constructor(
    private readonly evmSingleTransferBuilder: EvmSingleTransferBuilder,
    private readonly internalEvmSingleTransferBuilder: InternalEvmSingleTransferBuilder,
  ) {
    super()
  }

  async execute(params: TransactionBuilderType): Promise<SingleTransferResult> {
    return params.executionType === ExecutionType.INTERNAL
      ? this.internalEvmSingleTransferBuilder.execute(params)
      : this.evmSingleTransferBuilder.execute(params)
  }
}
