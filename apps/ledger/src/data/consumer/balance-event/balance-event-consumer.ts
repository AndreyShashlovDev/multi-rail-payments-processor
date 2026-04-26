import {
  CoreJetstreamDataSource,
  CoreJetstreamHandler,
} from '../../data-source/nats-jetstream/core/core-jetstream-data-source.service'
import { Injectable } from '@nestjs/common'
import { BalanceChangeEvent } from './balance-event-consumer.types'
import { BalanceChangeRequestEvent } from '@app/shared/services/ledger/v1'
import { BalanceEventConsumerMapper } from './balance-event-consumer.mapper'
import { toError } from '@app/utils'

export interface BalanceEventSubscription {
  readonly handler: (msg: BalanceChangeEvent) => Promise<void>
}

@Injectable()
export class BalanceEventConsumer implements CoreJetstreamHandler {
  private readonly subscriptions: BalanceEventSubscription[] = []

  constructor(private readonly coreJetstreamDataSource: CoreJetstreamDataSource) {
    coreJetstreamDataSource.setupHandler(this)
  }

  async balanceChangeHandler(event: BalanceChangeRequestEvent): Promise<void> {
    const validated = BalanceEventConsumerMapper.validateEvent(event)
    const data = BalanceEventConsumerMapper.toDomain(validated)

    const result = await Promise.allSettled(this.subscriptions.map(async (sub) => await sub.handler(data)))

    const failed = result.filter((r): r is PromiseRejectedResult => r.status === 'rejected')

    if (failed.length > 0) {
      const reasons = failed.map((r) => toError(r.reason).message).join(', ')
      throw new Error(`${failed.length} handler(s) failed: ${reasons}`)
    }
  }

  subscribeToBalanceChangeEvent(subscription: BalanceEventSubscription) {
    this.subscriptions.push(subscription)
  }
}
