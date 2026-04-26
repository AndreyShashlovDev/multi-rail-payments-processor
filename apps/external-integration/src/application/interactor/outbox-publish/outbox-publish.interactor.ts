import { AbstractInteractor } from '@app/types'
import { Injectable, Logger } from '@nestjs/common'
import { TxContextRunner, PromiseQueue } from '@app/shared'
import { OutboxRepository } from '../../../data/repository/outbox/outbox.repository'
import { OutboxModel, OutboxUniqueKey } from '../../../data/repository/outbox/outbox-repository.types'
import { TransactionEventPublisher } from '../../../data/publisher/transaction-event/transaction-event.publisher'
import { TransactionEvent } from '@app/shared/services/external-integration/v1'

@Injectable()
export class OutboxPublishInteractor extends AbstractInteractor<never, Promise<void>> {
  private static readonly MAX_ITEMS = 50

  private readonly logger: Logger = new Logger(OutboxPublishInteractor.name)
  private readonly queue = new PromiseQueue({ maxSize: 1 })

  constructor(
    private readonly txRunner: TxContextRunner,
    private readonly outboxRepository: OutboxRepository,
    private readonly transactionEventPublisher: TransactionEventPublisher,
  ) {
    super()
  }

  async execute(): Promise<void> {
    await this.queue.enqueue(() => this.publish())
  }

  private async publish(): Promise<void> {
    try {
      const pending = await this.txRunner
        .create<ReadonlyArray<OutboxModel>>()
        .pipeline(async (ctx) => {
          await this.outboxRepository.resetStuck(ctx)
          return await this.outboxRepository.findPending(OutboxPublishInteractor.MAX_ITEMS, ctx)
        })
        .execute()

      if (!pending.length) return

      const sent: Set<OutboxUniqueKey> = new Set<OutboxUniqueKey>()
      const failed: Set<OutboxUniqueKey> = new Set<OutboxUniqueKey>()

      for (const entry of pending) {
        try {
          await this.route(entry)
          sent.add(entry.id)
        } catch (e) {
          this.logger.error(`${OutboxPublishInteractor.name} failed to publish event ${entry.event} id=${entry.id}`, e)
          failed.add(entry.id)
        }
      }

      await this.txRunner
        .create()
        .pipeline(async (ctx) => {
          if (sent.size) await this.outboxRepository.markSent(sent, ctx)
          if (failed.size) await this.outboxRepository.incrementRetries(failed, ctx)
        })
        .execute()
    } catch (e) {
      this.logger.error(`${OutboxPublishInteractor.name} failed`, e)
    }
  }

  private async route(entry: OutboxModel): Promise<void> {
    if (this.transactionEventPublisher.isSupportEvent(entry.event)) {
      await this.transactionEventPublisher.publish(JSON.parse(entry.payload) as TransactionEvent)

      return
    }

    throw new Error(`Unsupported event type: ${entry.event}`)
  }
}
