import {
  IntegrationJetstreamDataSource,
  IntegrationJetstreamHandler,
} from '../../data-source/nats-jetstream/integration/integration-jetstream-data-source.service'
import { TransactionEvent } from '@app/shared/services/external-integration/v1'
import { ExternalIntegrationConsumerMapper } from './external-integration-consumer.mapper'
import { Injectable } from '@nestjs/common'
import { TransactionModel } from '../../../shared/model/transaction.model'
import { toError } from '@app/utils'
import { CurrencyRepository } from '../../repository/currency/currency.repository'
import { JsonObject } from '@app/types'

export interface TransactionEventSubscription {
  readonly handler: (tx: TransactionModel) => Promise<void>
}

@Injectable()
export class ExternalIntegrationConsumer implements IntegrationJetstreamHandler {
  private readonly subscriptions: TransactionEventSubscription[] = []

  constructor(
    integrationJetstreamDataSource: IntegrationJetstreamDataSource,
    private readonly currencyRepository: CurrencyRepository,
  ) {
    integrationJetstreamDataSource.setupHandler(this)
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
