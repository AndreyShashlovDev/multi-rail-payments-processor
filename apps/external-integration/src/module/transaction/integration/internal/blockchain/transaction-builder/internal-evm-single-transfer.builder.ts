import {
  AbstractInteractor,
  IntegrationAccount,
  type IntegrationCurrency,
  SourceTransactionId,
  Numeric,
  RawNumeric,
} from '@app/types'
import { IntegrationType } from '@app/shared'
import { randomBytes } from 'node:crypto'

export interface EvmSingleTransferParams {
  readonly integration: IntegrationType
  readonly fromAccount: IntegrationAccount
  readonly fromAmount: RawNumeric
  readonly fromCurrency: IntegrationCurrency
  readonly toAccount: IntegrationAccount
  readonly toAmount: RawNumeric
  readonly toCurrency: IntegrationCurrency
}

export interface EvmTransaction {
  readonly hash: SourceTransactionId
  readonly nonce: number
  readonly from: IntegrationAccount
  readonly to: IntegrationAccount | IntegrationCurrency
}

export interface EvmSingleTransferResult {
  readonly id: SourceTransactionId
  readonly executor: IntegrationAccount
  readonly estimatedFeeCurrency: IntegrationCurrency
  readonly estimatedFee: RawNumeric
  readonly rawTransaction: EvmTransaction
}

export class InternalEvmSingleTransferBuilder extends AbstractInteractor<
  EvmSingleTransferParams,
  Promise<EvmSingleTransferResult>
> {
  async execute(params: EvmSingleTransferParams): Promise<EvmSingleTransferResult> {
    const hash: SourceTransactionId = `0x${randomBytes(20).toString('hex')}`
    // estimate tx fee
    const fee = Numeric.ZERO.toString()

    return {
      id: hash,
      executor: params.fromAccount,
      estimatedFeeCurrency: 'native',
      estimatedFee: fee,
      rawTransaction: {
        hash,
        from: params.fromAccount,
        to: params.toCurrency,
        nonce: Math.round(Math.random() * 1000),
      },
    }
  }
}
