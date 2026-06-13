import { AbstractInteractor, IntegrationAccount, Numeric, IntegrationCurrency, RawNumeric, UUID, Id } from '@app/types'
import { Injectable } from '@nestjs/common'
import { InternalEvmSingleTransferBuilder } from './internal/blockchain/transaction-builder/internal-evm-single-transfer.builder'
import { EvmSingleTransferBuilder } from './blockchain/transaction-builder/evm-single-transfer.builder'
import { ExecutionType, IntegrationType } from '@app/shared'
import { IntegrationAccountRepository } from '../../../../data/repository/integration-account/integration-account.repository'
import { RelayerStrategy } from '../relayer/relayer.strategy'
import { TransferIntentModel } from '../../../transfer-intent/model/transfer-intent.model'
import { TransactionIntentData } from '../../model/transaction-intent.model'
import { TransferRouteData, TransferRouteStatus } from '../../../../shared/model/transfer-route.model'
import { CorePaymentRepository } from '../../../../data/repository/core-payment/core-payment.repository'

export type TransferRouteExecutionPlannerParamsType = TransferIntentModel[]

export interface TransferRoutePlanEntry {
  readonly tx: TransactionIntentData
  readonly routes: ReadonlyArray<TransferRouteData>
}

export interface TransferRouteExecutionPlan {
  readonly exchanges: ReadonlyArray<TransferRoutePlanEntry>
}

@Injectable()
export class TransferRouteExecutionPlanner extends AbstractInteractor<
  TransferRouteExecutionPlannerParamsType,
  Promise<TransferRouteExecutionPlan>
> {
  constructor(
    private readonly evmSingleTransferBuilder: EvmSingleTransferBuilder,
    private readonly internalEvmSingleTransferBuilder: InternalEvmSingleTransferBuilder,
    private readonly integrationAccountRepository: IntegrationAccountRepository,
    private readonly relayerStrategy: RelayerStrategy,
    private readonly corePaymentRepository: CorePaymentRepository,
  ) {
    super()
  }

  async execute(params: TransferRouteExecutionPlannerParamsType): Promise<TransferRouteExecutionPlan> {
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
    const transferIntent = params[0]

    const isCrossChainOrCrossCurrency =
      (transferIntent.fromIntegration !== transferIntent.toIntegration &&
        transferIntent.fromCurrency === transferIntent.toCurrency) ||
      (transferIntent.fromIntegration === transferIntent.toIntegration &&
        transferIntent.fromCurrency !== transferIntent.toCurrency)

    const exchanges: TransferRoutePlanEntry[] = []

    // todo optimization: if both transactions are INTERNAL and same integration (cross-currency same chain),
    // they can be combined into a single transaction_intent with two transfers.
    // Currently always creates two separate transaction_intents for cross cases.
    if (isCrossChainOrCrossCurrency) {
      exchanges.push(...(await this.createCrossTransaction({ platformAccounts, transferIntent })))
    } else {
      exchanges.push(
        await this.createSingleTransaction({
          transferRouteIndex: 0,
          platformAccounts,
          transfer: {
            integration: transferIntent.fromIntegration,
            from: transferIntent.fromAccount,
            to: transferIntent.toAccount,
            currency: transferIntent.fromCurrency,
            amount: transferIntent.fromRawAmount,
          },
          transferIntent: { id: transferIntent.id, intentId: transferIntent.intentId },
        }),
      )
    }

    return { exchanges }
  }

  private async createCrossTransaction({
    platformAccounts,
    transferIntent,
  }: {
    platformAccounts: ReadonlySet<IntegrationAccount>
    transferIntent: TransferIntentModel
  }): Promise<ReadonlyArray<TransferRoutePlanEntry>> {
    // for internal transfer
    const internalRelayer = await this.relayerStrategy.getAccount({
      from: transferIntent.fromAccount,
      to: transferIntent.fromAccount,
      fromIntegration: transferIntent.fromIntegration,
      toIntegration: transferIntent.toIntegration,
      fromCurrency: transferIntent.fromCurrency,
      toCurrency: transferIntent.toCurrency,
      fromAmount: transferIntent.fromRawAmount,
      toAmount: transferIntent.toRawAmount,
    })

    const txIn = await this.createTransaction({
      transferRouteIndex: 0,
      executionType: ExecutionType.INTERNAL,
      executor: transferIntent.fromAccount,
      transfer: {
        integration: transferIntent.fromIntegration,
        initiator: transferIntent.fromAccount,
        from: transferIntent.fromAccount,
        to: internalRelayer,
        currency: transferIntent.fromCurrency,
        amount: transferIntent.fromRawAmount,
      },
      transferIntent: { id: transferIntent.id, intentId: transferIntent.intentId },
    })

    const txOutExecutionType = platformAccounts.has(transferIntent.toAccount)
      ? ExecutionType.INTERNAL
      : ExecutionType.NATIVE

    // for relayer
    const relayer = await this.relayerStrategy.getAccount({
      from: transferIntent.fromAccount,
      to: transferIntent.toAccount,
      fromIntegration: transferIntent.fromIntegration,
      toIntegration: transferIntent.toIntegration,
      fromCurrency: transferIntent.fromCurrency,
      toCurrency: transferIntent.toCurrency,
      fromAmount: transferIntent.fromRawAmount,
      toAmount: transferIntent.toRawAmount,
      // todo add fee of tx! (we should looking for relayer show can pay for tx. if txOutExecutionType === NATIVE)
    })

    const txOut = await this.createTransaction({
      transferRouteIndex: 1,
      executionType: txOutExecutionType,
      executor: relayer,
      transfer: {
        integration: transferIntent.toIntegration,
        initiator: relayer,
        from: relayer,
        to: transferIntent.toAccount,
        currency: transferIntent.toCurrency,
        amount: transferIntent.toRawAmount,
      },
      transferIntent: { id: transferIntent.id, intentId: transferIntent.intentId },
    })

    // payment for first internal transfer
    await this.corePaymentRepository.createPayment({
      idempotencyKey: transferIntent.id,
      integration: transferIntent.fromIntegration,
      from: transferIntent.fromAccount,
      to: internalRelayer,
      currency: transferIntent.fromCurrency,
      amount: transferIntent.fromRawAmount,
    })

    return [txIn, txOut]
  }

  private async createSingleTransaction({
    transferRouteIndex,
    platformAccounts,
    transferIntent,
    transfer,
  }: {
    transferRouteIndex: number
    platformAccounts: ReadonlySet<IntegrationAccount>
    transferIntent: {
      id: Id
      intentId: UUID | Id
    }
    transfer: {
      integration: IntegrationType
      from: IntegrationAccount
      to: IntegrationAccount
      currency: IntegrationCurrency
      amount: RawNumeric
    }
  }): Promise<TransferRoutePlanEntry> {
    const { from, to, integration, currency, amount } = transfer

    let fromAccount: IntegrationAccount | null = from

    const executionType =
      platformAccounts.has(from) && platformAccounts.has(to) ? ExecutionType.INTERNAL : ExecutionType.NATIVE

    if (executionType === ExecutionType.NATIVE) {
      fromAccount = await this.relayerStrategy.getAccount({
        from,
        to,
        fromIntegration: integration,
        toIntegration: integration,
        fromCurrency: currency,
        toCurrency: currency,
        fromAmount: amount,
        toAmount: amount,
      })
    }

    if (!fromAccount) {
      throw new Error('fromAccount is undefined!')
    }

    return await this.createTransaction({
      transferRouteIndex,
      executionType,
      executor: fromAccount,
      transferIntent,
      transfer: {
        ...transfer,
        initiator: transfer.from,
        from: fromAccount,
      },
    })
  }
  private async createTransaction({
    transferRouteIndex,
    executionType,
    executor,
    transferIntent,
    transfer,
  }: {
    transferRouteIndex: number
    executionType: ExecutionType
    executor: IntegrationAccount
    transferIntent: {
      id: Id
      intentId: UUID | Id
    }
    transfer: {
      integration: IntegrationType
      initiator: IntegrationAccount
      from: IntegrationAccount
      to: IntegrationAccount
      currency: IntegrationCurrency
      amount: RawNumeric
    }
  }): Promise<TransferRoutePlanEntry> {
    const { initiator, from, to, integration, currency, amount } = transfer

    const transferBuilderParams = {
      integration,
      fromAccount: from,
      fromAmount: amount,
      fromCurrency: currency,
      toAccount: to,
      toAmount: amount,
      toCurrency: currency,
    }

    const txSingleTransfer = await (executionType === ExecutionType.INTERNAL
      ? this.internalEvmSingleTransferBuilder.execute(transferBuilderParams)
      : this.evmSingleTransferBuilder.execute(transferBuilderParams))

    return {
      tx: {
        executionType,
        initiator: executor,
        sourceTxId: txSingleTransfer.id,
        integration,
        fee: txSingleTransfer.estimatedFee,
        feeCurrency: txSingleTransfer.estimatedFeeCurrency,
        rawData: txSingleTransfer.rawTransaction,
      },
      routes: [
        {
          transactionIntentId: null,
          transferIntentId: transferIntent.id,
          intentId: transferIntent.intentId,
          txId: null,
          txIndex: transferRouteIndex,
          executionType,
          initiator,
          integration,
          fromAccount: from,
          toAccount: to,
          rawAmount: Numeric.create(amount),
          currency,
          status: TransferRouteStatus.CREATED,
        },
      ],
    }
  }
}
