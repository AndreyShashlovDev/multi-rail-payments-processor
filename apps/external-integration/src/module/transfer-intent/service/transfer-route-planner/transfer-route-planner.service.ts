import { AbstractInteractor, IntegrationAccount, Numeric, IntegrationCurrency, RawNumeric, UUID, Id } from '@app/types'
import { Injectable } from '@nestjs/common'
import { ExecutionType, IntegrationType } from '@app/shared'
import { IntegrationAccountRepository } from '../../repository/integration-account/integration-account.repository'
import { RelayerStrategy } from '../relayer/relayer.strategy'
import { TransferIntentModel } from '../../model/transfer-intent.model'
import { TransferRouteData, TransferRouteModel, TransferRouteStatus } from '../../model/transfer-route.model'
import { CorePaymentRepository } from '../../repository/core-payment/core-payment.repository'

export type TransferRoutePlannerParamsType = ReadonlyArray<TransferIntentModel>

interface TransferRouteIntentRef {
  readonly id: Id
  readonly intentId: UUID | Id
}

interface TransferRouteTransfer {
  readonly integration: IntegrationType
  readonly initiator: IntegrationAccount
  readonly from: IntegrationAccount
  readonly to: IntegrationAccount
  readonly currency: IntegrationCurrency
  readonly amount: RawNumeric
}

// Decides which steps (transfer routes) a transfer intent consists of.
// Does not build transactions: see TransferRouteTransactionBuilder.
@Injectable()
export class TransferRoutePlanner extends AbstractInteractor<
  TransferRoutePlannerParamsType,
  Promise<ReadonlyArray<TransferRouteData>>
> {
  constructor(
    private readonly integrationAccountRepository: IntegrationAccountRepository,
    private readonly relayerStrategy: RelayerStrategy,
    private readonly corePaymentRepository: CorePaymentRepository,
  ) {
    super()
  }

  async execute(params: TransferRoutePlannerParamsType): Promise<ReadonlyArray<TransferRouteData>> {
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

    // todo optimization: if both transactions are INTERNAL and same integration (cross-currency same chain),
    // they can be combined into a single transaction_intent with two transfers.
    // Currently always creates two separate transaction_intents for cross cases.
    if (isCrossChainOrCrossCurrency) {
      return await this.createCrossRoutes({ platformAccounts, transferIntent })
    }

    return [
      await this.createSingleRoute({
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
    ]
  }

  /**
   * Resolves the parameters of the next step right before it is started, from what the completed steps
   * produced (`result`, reported by the executor with TransferRouteCompleted).
   * With the platform relayer the amounts are fixed by Core at planning time, so the planned step is final.
   * A step that depends on the previous one resolves here: e.g. a bridge fill takes the depositId of the
   * bridge deposit step, a step after a DEX swap takes the amount actually received.
   */
  resolveNext(next: TransferRouteModel, _completed: ReadonlyArray<TransferRouteModel>): TransferRouteModel {
    return next
  }

  private async createCrossRoutes({
    platformAccounts,
    transferIntent,
  }: {
    platformAccounts: ReadonlySet<IntegrationAccount>
    transferIntent: TransferIntentModel
  }): Promise<ReadonlyArray<TransferRouteData>> {
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

    const routeIn = this.createRoute({
      transferRouteIndex: 0,
      executionType: ExecutionType.INTERNAL,
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

    const routeOutExecutionType = platformAccounts.has(transferIntent.toAccount)
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
      // todo add fee of tx! (we should looking for relayer show can pay for tx. if routeOutExecutionType === NATIVE)
    })

    const routeOut = this.createRoute({
      transferRouteIndex: 1,
      executionType: routeOutExecutionType,
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

    return [routeIn, routeOut]
  }

  private async createSingleRoute({
    transferRouteIndex,
    platformAccounts,
    transferIntent,
    transfer,
  }: {
    transferRouteIndex: number
    platformAccounts: ReadonlySet<IntegrationAccount>
    transferIntent: TransferRouteIntentRef
    transfer: Omit<TransferRouteTransfer, 'initiator'>
  }): Promise<TransferRouteData> {
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

    return this.createRoute({
      transferRouteIndex,
      executionType,
      transferIntent,
      transfer: {
        ...transfer,
        initiator: transfer.from,
        from: fromAccount,
      },
    })
  }

  // route.fromAccount is the account that executes (signs) the step transaction
  private createRoute({
    transferRouteIndex,
    executionType,
    transferIntent,
    transfer,
  }: {
    transferRouteIndex: number
    executionType: ExecutionType
    transferIntent: TransferRouteIntentRef
    transfer: TransferRouteTransfer
  }): TransferRouteData {
    return {
      transferIntentId: transferIntent.id,
      intentId: transferIntent.intentId,
      txId: null,
      txIndex: transferRouteIndex,
      executionType,
      initiator: transfer.initiator,
      integration: transfer.integration,
      fromAccount: transfer.from,
      toAccount: transfer.to,
      rawAmount: Numeric.create(transfer.amount),
      currency: transfer.currency,
      status: TransferRouteStatus.CREATED,
      result: null,
    }
  }
}
