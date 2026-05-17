import { LedgerConsumerMapper } from './ledger-consumer.mapper'
import { BalanceUpdatedSubscription, BalanceProjectionUpdatedSubscription } from './ledger-consumer.types'
import { Injectable } from '@nestjs/common'
import {
  LedgerJetstreamDataSource,
  LedgerJetstreamHandler,
} from '../../data-source/nats-jetstream/ledger/ledger-jetstream.data-source'
import { BalanceUpdatedEvent } from '@app/shared/services/ledger/v1'
import { toError } from '@app/utils'
import { JsonObject } from '@app/types'
import { BalanceProjectionUpdatedEvent } from '@app/shared/services/ledger/v1/event/balance-projection-updated.event'

@Injectable()
export class LedgerConsumer implements LedgerJetstreamHandler {
  private readonly balanceUpdatedSubscriptions: BalanceUpdatedSubscription[] = []
  private readonly balanceProjectionUpdatedSubscriptions: BalanceProjectionUpdatedSubscription[] = []

  constructor(ledgerJetstreamDataSource: LedgerJetstreamDataSource) {
    ledgerJetstreamDataSource.setupHandler(this)
  }

  async balanceUpdatedEventHandler(event: JsonObject<BalanceUpdatedEvent>): Promise<void> {
    const validated = LedgerConsumerMapper.balanceUpdatedEventValidate(event)
    const data = LedgerConsumerMapper.eventToBalanceUpdatedResult(validated)

    const result = await Promise.allSettled(
      this.balanceUpdatedSubscriptions.map(async (subscription) => {
        const { handler, filter } = subscription

        const filteredResult = {
          ...data,
          changes: data.changes.filter((item) => {
            let result: boolean = true

            if (result && filter?.intentType) {
              result = item.intentType === filter.intentType
            }

            if (result && filter?.status) {
              result = filter.status.has(item.type)
            }

            return result
          }),
        }

        if (filteredResult.changes.length > 0) {
          await handler(filteredResult)
        }
      }),
    )

    const failed = result.filter((r): r is PromiseRejectedResult => r.status === 'rejected')

    if (failed.length > 0) {
      const reasons = failed.map((r) => toError(r.reason).message).join(', ')
      throw new Error(`${failed.length} handler(s) failed: ${reasons}`)
    }
  }

  async balanceProjectionUpdatedEventHandler(event: JsonObject<BalanceProjectionUpdatedEvent>): Promise<void> {
    const validated = LedgerConsumerMapper.balanceProjectionEventValidate(event)
    const data = LedgerConsumerMapper.eventToBalanceProjectionUpdatedResult(validated)

    const result = await Promise.allSettled(
      this.balanceProjectionUpdatedSubscriptions.map(async (subscription) => {
        const { handler } = subscription

        if (data.projections.length > 0) {
          await handler(data)
        }
      }),
    )

    const failed = result.filter((r): r is PromiseRejectedResult => r.status === 'rejected')

    if (failed.length > 0) {
      const reasons = failed.map((r) => toError(r.reason).message).join(', ')
      throw new Error(`${failed.length} handler(s) failed: ${reasons}`)
    }
  }

  subscribeToChangeBalance(subscription: BalanceUpdatedSubscription): void {
    this.balanceUpdatedSubscriptions.push(subscription)
  }

  subscribeToChangeProjectionBalance(subscription: BalanceProjectionUpdatedSubscription): void {
    this.balanceProjectionUpdatedSubscriptions.push(subscription)
  }
}
