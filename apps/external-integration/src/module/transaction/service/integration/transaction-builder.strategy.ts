import { AbstractInteractor, IntegrationAccount, Numeric } from '@app/types'
import { Injectable } from '@nestjs/common'
import { InternalEvmSingleTransferBuilder } from './internal/blockchain/transaction-builder/internal-evm-single-transfer.builder'
import { EvmSingleTransferBuilder } from './blockchain/transaction-builder/evm-single-transfer.builder'
import { ExecutionType } from '@app/shared'
import { IntegrationAccountRepository } from '../../../../data/repository/integration-account/integration-account.repository'
import { RelayerStrategy } from '../relayer/relayer.strategy'
import { TransferIntentModel } from '../../../transfer-intent/model/transfer-intent.model'
import { TransactionIntentData } from '../../model/transaction-intent.model'
import { TransferRouteData, TransferRouteStatus } from '../../../../shared/model/transfer-route.model'

export type TransactionBuilderType = TransferIntentModel[]

export interface TransactionBuilderResult {
  readonly tx: TransactionIntentData
  readonly routes: ReadonlyArray<TransferRouteData>
}

@Injectable()
export class TransactionBuilderStrategy extends AbstractInteractor<
  TransactionBuilderType,
  Promise<TransactionBuilderResult>
> {
  constructor(
    private readonly evmSingleTransferBuilder: EvmSingleTransferBuilder,
    private readonly internalEvmSingleTransferBuilder: InternalEvmSingleTransferBuilder,
    private readonly integrationAccountRepository: IntegrationAccountRepository,
    private readonly relayerStrategy: RelayerStrategy,
  ) {
    super()
  }

  async execute(params: TransactionBuilderType): Promise<TransactionBuilderResult> {
    if (params.length === 0) {
      throw new Error('Intent transfer not presented!')
    }

    const accounts = params.flatMap((item) => [item.fromAccount, item.toAccount])
    const platformAccounts = (
      await this.integrationAccountRepository.hasAccounts({
        accounts: new Set(accounts),
      })
    ).existing

    if (params.length > 1) {
      throw new Error('Now we support just single transfer')
    }

    // now we support just single transfer
    const intent = params[0]

    const executionType =
      platformAccounts.has(intent.fromAccount) && platformAccounts.has(intent.toAccount)
        ? ExecutionType.INTERNAL
        : ExecutionType.NATIVE

    let fromAccount: IntegrationAccount | null = intent.fromAccount

    if (executionType === ExecutionType.NATIVE) {
      fromAccount = await this.relayerStrategy.getAccount({
        from: intent.fromAccount,
        to: intent.toAccount,
        fromIntegration: intent.fromIntegration,
        toIntegration: intent.toIntegration,
        fromCurrency: intent.fromCurrency,
        toCurrency: intent.toCurrency,
        fromAmount: intent.fromRawAmount,
        toAmount: intent.toRawAmount,
        platformAccounts,
      })
    }

    if (!fromAccount) {
      throw new Error('fromAccount is undefined!')
    }

    const transferBuilderParams = {
      ...intent,
      integration: intent.fromIntegration,
      fromAmount: intent.fromRawAmount,
      toAmount: intent.toRawAmount,
    }

    const txSingleTransfer = await (executionType === ExecutionType.INTERNAL
      ? this.internalEvmSingleTransferBuilder.execute(transferBuilderParams)
      : this.evmSingleTransferBuilder.execute(transferBuilderParams))

    return {
      tx: {
        executionType,
        initiator: fromAccount,
        sourceTxId: txSingleTransfer.id,
        integration: intent.fromIntegration,
        fee: txSingleTransfer.estimatedFee,
        feeCurrency: txSingleTransfer.estimatedFeeCurrency,
        rawData: txSingleTransfer.rawTransaction,
      },
      routes: [
        {
          transactionIntentId: null,
          transferIntentId: intent.id,
          intentId: intent.intentId,
          txId: null,
          txIndex: 0,
          executionType,
          integration: intent.fromIntegration,
          fromAccount,
          toAccount: intent.toAccount,
          rawAmount: Numeric.create(intent.fromRawAmount),
          currency: intent.fromCurrency,
          status: TransferRouteStatus.CREATED,
        },
      ],
    }
  }
}
