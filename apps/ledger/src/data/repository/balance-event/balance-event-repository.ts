import {
  CoreJetstreamDataSource,
  CoreJetstreamHandler,
} from '../../data-source/nats-jetstream/core/core-jetstream-data-source.service'
import { Injectable } from '@nestjs/common'
import { BalanceChangeEvent, BalanceUpdatedData, BalanceFailedData } from './balance-event-repository.types'
import { BalanceUpdatedEvent, BalanceChangeRequestEvent } from '@app/shared/services/ledger/v1'
import { BALANCE_UPDATED_STREAM_SUBJECT } from '@app/shared/nat-stream/balance-updated-stream.types'
import { BalanceEventRepositoryMapper } from './balance-event-repository.mapper'
import { toError } from '@app/utils'
import { BalanceFailedEvent } from '@app/shared/services/ledger/v1/event/balance-failed.event'
import { BALANCE_FAILED_STREAM_SUBJECT } from '@app/shared/nat-stream/balance-failed-stream.types'

export interface BalanceEventSubscription {
  readonly handler: (msg: BalanceChangeEvent) => Promise<void>
}

@Injectable()
export class BalanceEventRepository implements CoreJetstreamHandler {
  private readonly subscriptions: BalanceEventSubscription[] = []

  constructor(private readonly coreJetstreamDataSource: CoreJetstreamDataSource) {
    coreJetstreamDataSource.setupHandler(this)
  }

  async balanceChangeHandler(event: BalanceChangeRequestEvent): Promise<void> {
    const validated = BalanceEventRepositoryMapper.validateEvent(event)
    const data = BalanceEventRepositoryMapper.toDomain(validated)

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

  async publishSuccess(data: BalanceUpdatedData): Promise<void> {
    await this.coreJetstreamDataSource.publish(
      BALANCE_UPDATED_STREAM_SUBJECT,
      new BalanceUpdatedEvent(
        data.uniqueKey,
        data.changes.map((item) => ({
          ...item,
          amount: item.amount.toString(),
        })),
      ),
    )
  }

  async publishFailed(data: BalanceFailedData): Promise<void> {
    await this.coreJetstreamDataSource.publish(
      BALANCE_FAILED_STREAM_SUBJECT,
      new BalanceFailedEvent(
        data.uniqueKey,
        data.changes.map((item) => ({
          ...item,
          amount: item.amount.toString(),
        })),
        data.errors,
      ),
    )
  }
}
