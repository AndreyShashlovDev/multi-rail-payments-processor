import {
  IntegrationJetstreamDataSource,
  IntegrationJetstreamHandler,
} from '../../data-source/nats-jetstream/integration/integration-jetstream-data-source.service'
import { TransactionEvent, TransferIntentCreateEvent } from '@app/shared/services/external-integration/v1'
import { ExternalIntegrationMapper } from './external-integration.mapper'
import { IntegrationType } from '@app/shared'
import { Injectable } from '@nestjs/common'
import { TransactionModel } from '../../../module/transaction/model/transaction.model'
import { DataSource } from 'typeorm'
import { IntegrationCurrency, Numeric, UUID } from '@app/types'
import { IntegrationCurrencyEntity } from '../../data-source/postgres/entities/integration-currency.entity'
import { InjectDataSource } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { toError } from '@app/utils'
import {
  EstimateTransferFeeData,
  EstimateTransferFeeResult,
  TransactionIntentData,
  TransferIntentHeldData,
} from './external-integration.types'
import { transferIntentSubject } from '@app/shared/nat-stream/transfer-intent-stream.types'
import { randomUUID } from 'node:crypto'
import { TransferIntentHeldEvent } from '@app/shared/services/external-integration/v1/event/transfer-intent-held.event'

export interface TransactionEventSubscription {
  readonly handler: (tx: TransactionModel) => Promise<void>
}

@Injectable()
export class ExternalIntegrationRepository implements IntegrationJetstreamHandler {
  private readonly subscriptions: TransactionEventSubscription[] = []
  private readonly exponentByCurrency: ReadonlyMap<IntegrationType, ReadonlyMap<IntegrationCurrency, number>> =
    new Map()

  constructor(
    private readonly integrationJetstreamDataSource: IntegrationJetstreamDataSource,
    @InjectDataSource(CorePostgresConfig.DATASOURCE_NAME) private readonly datasource: DataSource,
  ) {
    integrationJetstreamDataSource.setupHandler(this)
  }

  async transactionEventHandler(event: TransactionEvent): Promise<void> {
    const exponents = await this.getCurrencyExponent()
    const validated = ExternalIntegrationMapper.transactionEventValidate(event)
    const data = ExternalIntegrationMapper.transactionEventToDomain(validated, exponents)

    const result = await Promise.allSettled(this.subscriptions.map(async (sub) => await sub.handler(data)))

    const failed = result.filter((r): r is PromiseRejectedResult => r.status === 'rejected')

    if (failed.length > 0) {
      const reasons = failed.map((r) => toError(r.reason).message).join(', ')
      throw new Error(`${failed.length} handler(s) failed: ${reasons}`)
    }
  }

  subscribeToTransactionEvent(subscription: TransactionEventSubscription): void {
    this.subscriptions.push(subscription)
  }

  private async getCurrencyExponent(): Promise<ReadonlyMap<IntegrationType, ReadonlyMap<IntegrationCurrency, number>>> {
    if (this.exponentByCurrency.size === 0) {
      const result = await this.datasource.manager.find(IntegrationCurrencyEntity)

      result.reduce((acc, curr) => {
        const map = acc.get(curr.integration) ?? new Map<IntegrationCurrency, number>()
        map.set(curr.currency, curr.unitExponent)

        return acc.set(curr.integration, map)
      }, new Map<IntegrationType, Map<IntegrationCurrency, number>>())
    }

    return this.exponentByCurrency
  }

  async estimateTransferFee(param: EstimateTransferFeeData): Promise<EstimateTransferFeeResult> {
    // todo grpc request external integration service (make estimate for few minutes?)
    return {
      id: randomUUID(),
      integration: param.fromIntegration,
      amount: Numeric.create('0.2'),
      currency: 'native',
    }
  }

  /**
   * return pre-calculated transfer fee from {@link estimateTransferFee}
   * @param estimatedFeeId
   */
  async getEstimatedTransferFee(estimatedFeeId: UUID): Promise<EstimateTransferFeeResult> {
    // todo grpc request
    return {
      id: estimatedFeeId,
      integration: IntegrationType.ETHEREUM,
      amount: Numeric.create('0.2'),
      currency: 'native',
    }
  }

  async createTransactionIntent(data: TransactionIntentData): Promise<void> {
    const exponentByCurrency = await this.getCurrencyExponent()
    const currencyExponentByFromIntegration = exponentByCurrency.get(data.fromIntegration)
    const estimatedFee = Numeric.toExponent(
      data.estimatedFee,
      currencyExponentByFromIntegration?.get(data.feeCurrency) ?? 18,
    )
    const fromAmount = Numeric.toExponent(
      data.fromAmount,
      currencyExponentByFromIntegration?.get(data.fromCurrency) ?? 18,
    )

    const currencyExponentByToIntegration = exponentByCurrency.get(data.toIntegration)
    const toAmount = Numeric.toExponent(data.toAmount, currencyExponentByToIntegration?.get(data.toCurrency) ?? 18)

    await this.integrationJetstreamDataSource.publish(
      transferIntentSubject('create'),
      new TransferIntentCreateEvent(
        data.intentId,
        data.intentId,
        data.intentType,
        estimatedFee,
        data.feeCurrency,
        fromAmount,
        data.fromIntegration,
        data.fromCurrency,
        data.from,
        toAmount,
        data.toIntegration,
        data.toCurrency,
        data.to,
      ),
    )
  }

  async heldTransactionIntent(data: TransferIntentHeldData) {
    await this.integrationJetstreamDataSource.publish(
      transferIntentSubject('held'),
      new TransferIntentHeldEvent(`${data.intentType}-${data.intentIds.join(',')}`, data.intentType, data.intentIds),
    )
  }
}
