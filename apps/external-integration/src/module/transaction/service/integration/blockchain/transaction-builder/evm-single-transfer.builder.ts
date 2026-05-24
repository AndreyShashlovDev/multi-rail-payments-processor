import {
  AbstractInteractor,
  IntegrationAccount,
  IntegrationCurrency,
  SourceTransactionId,
  Numeric,
  RawNumeric,
  EvmAddress,
} from '@app/types'
import { IntegrationType } from '@app/shared'
import { randomBytes } from 'node:crypto'
import { EvmTransaction } from '../../../../model/transaction-intent.model'

export interface EvmSingleTransferParams {
  readonly integration: IntegrationType
  readonly fromAccount: IntegrationAccount
  readonly fromAmount: RawNumeric
  readonly fromCurrency: IntegrationCurrency
  readonly toAccount: IntegrationAccount
  readonly toAmount: RawNumeric
  readonly toCurrency: IntegrationCurrency
}

export interface EvmSingleTransferResult {
  readonly id: SourceTransactionId
  readonly executor: IntegrationAccount
  readonly estimatedFeeCurrency: IntegrationCurrency
  readonly estimatedFee: RawNumeric
  readonly rawTransaction: EvmTransaction
}

export class EvmSingleTransferBuilder extends AbstractInteractor<
  EvmSingleTransferParams,
  Promise<EvmSingleTransferResult>
> {
  async execute(params: EvmSingleTransferParams): Promise<EvmSingleTransferResult> {
    const hash: SourceTransactionId = `0x${randomBytes(20).toString('hex')}`
    // estimate tx fee
    const fee = Numeric.create('0.1').mul(Numeric.create(10).pow(18)).toString()

    return {
      id: hash,
      executor: params.fromAccount,
      estimatedFeeCurrency: 'native',
      estimatedFee: fee,
      rawTransaction: {
        hash,
        from: params.fromAccount,
        to:
          params.fromCurrency === 'native'
            ? params.toAccount
            : IntegrationAccount.create(params.integration, params.toCurrency as EvmAddress),
        nonce: Math.round(Math.random() * 1000),
        data: params.fromCurrency === 'native' ? null : '0xsometxdata',
      },
    }
  }
}
