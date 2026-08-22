import { TransactionEvent } from '@app/shared/services/external-integration/v1'
import { ExternalIntegrationConsumerMapper } from './external-integration-consumer.mapper'
import { Injectable } from '@nestjs/common'
import { TransactionModel } from '../../../shared/model/transaction.model'
import { toError } from '@app/utils'
import { CurrencyRepository } from '../../repository/currency/currency.repository'
import { JsonObject } from '@app/types'
import { TransactionEventHandler } from '@app/shared'
import { IntegrationKafkaDataSource } from '../../data-source/kafka/integration/integration-kafka-data-source.service'

export interface TransactionEventSubscription {
  readonly handler: (tx: TransactionModel) => Promise<void>
}

@Injectable()
export class ExternalIntegrationConsumer implements TransactionEventHandler {
  private readonly subscriptions: TransactionEventSubscription[] = []

  constructor(
    transactionEventSource: IntegrationKafkaDataSource,
    private readonly currencyRepository: CurrencyRepository,
  ) {
    transactionEventSource.setupHandler(this)
  }

  async transactionEventHandler(event: JsonObject<TransactionEvent>): Promise<void> {
    const exponents = await this.currencyRepository.getExponents()
    const validated = ExternalIntegrationConsumerMapper.transactionEventValidate(event)
    const data = ExternalIntegrationConsumerMapper.transactionEventToDomain(validated, exponents)

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
}
