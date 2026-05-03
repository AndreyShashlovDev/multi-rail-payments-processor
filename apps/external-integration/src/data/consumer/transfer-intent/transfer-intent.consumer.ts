import { Injectable } from '@nestjs/common'
import {
  CoreJetstreamHandler,
  CoreJetstreamDataSource,
  TransferIntentIncomingEventType,
} from '../../data-source/nats-jetstream/core-jetstream.data-source'
import { toError } from '@app/utils'
import { TransferIntentConsumerMapper } from './transfer-intent-consumer.mapper'
import { TransferIntentEventModel, TransferIntentEventKeyType } from './transfer-intent-consumer.types'
import { JsonObject } from '@app/types'

export interface TransferIntentEventSubscription<T extends TransferIntentEventKeyType = TransferIntentEventKeyType> {
  readonly filter?: { type: T }
  readonly handler: (event: TransferIntentEventModel<T>, type: T) => Promise<void>
}

@Injectable()
export class TransferIntentConsumer implements CoreJetstreamHandler {
  private readonly subscriptions: TransferIntentEventSubscription[] = []

  constructor(private readonly coreJetstreamDataSource: CoreJetstreamDataSource) {
    this.coreJetstreamDataSource.setupHandler(this)
  }

  async transferIntentEventHandler<T extends TransferIntentEventKeyType>(
    type: T,
    event: JsonObject<TransferIntentIncomingEventType>,
  ): Promise<void> {
    const model = await TransferIntentConsumerMapper.validateTransferIntentEvent<T>(type, event)

    const result = await Promise.allSettled(
      this.subscriptions
        .filter((sub): sub is TransferIntentEventSubscription<T> => !sub.filter || sub.filter.type === type)
        .map(async (sub) => await sub.handler(model, type)),
    )

    const failed = result.filter((r): r is PromiseRejectedResult => r.status === 'rejected')

    if (failed.length > 0) {
      const reasons = failed.map((r) => toError(r.reason).message).join(', ')
      throw new Error(`${failed.length} handler(s) failed: ${reasons}`)
    }
  }

  subscribeToTransferIntentEvent<T extends TransferIntentEventKeyType = TransferIntentEventKeyType>(
    subscription: TransferIntentEventSubscription<T>,
  ): void {
    this.subscriptions.push(subscription)
  }
}
