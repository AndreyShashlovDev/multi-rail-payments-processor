import { LedgerConsumerMapper } from './ledger-consumer.mapper'
import { BalanceUpdatedResult } from './ledger-consumer.types'
import { Injectable } from '@nestjs/common'
import {
  LedgerJetstreamDataSource,
  LedgerJetstreamHandler,
} from '../../data-source/nats-jetstream/ledger/ledger-jetstream.data-source'
import { BalanceChangeType, IntentType } from '@app/shared'
import { BalanceUpdatedEvent } from '@app/shared/services/ledger/v1'
import { toError } from '@app/utils'

export interface BalanceUpdatedSubscription {
  readonly handler: (item: BalanceUpdatedResult) => Promise<void>
  readonly filter?: {
    readonly intentType?: IntentType
    readonly status?: ReadonlySet<BalanceChangeType>
  }
}

@Injectable()
export class LedgerConsumer implements LedgerJetstreamHandler {
  private readonly subscriptions: BalanceUpdatedSubscription[] = []

  constructor(private readonly ledgerJetstreamDataSource: LedgerJetstreamDataSource) {
    this.ledgerJetstreamDataSource.setupHandler(this)
  }

  async balanceUpdatedEventHandler(event: BalanceUpdatedEvent): Promise<void> {
    const validated = LedgerConsumerMapper.balanceUpdatedEventValidate(event)
    const data = LedgerConsumerMapper.eventToBalanceUpdatedResult(validated)

    const result = await Promise.allSettled(
      this.subscriptions.map(async (subscription) => {
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

  subscribeToChangeBalance(subscription: BalanceUpdatedSubscription): void {
    this.subscriptions.push(subscription)
  }
}
