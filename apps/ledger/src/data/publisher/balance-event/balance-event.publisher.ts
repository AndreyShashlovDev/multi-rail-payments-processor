import { CoreJetstreamDataSource } from '../../data-source/nats-jetstream/core/core-jetstream-data-source.service'
import { BALANCE_UPDATED_STREAM_SUBJECT } from '@app/shared/nat-stream/balance-updated-stream.types'
import { BALANCE_FAILED_STREAM_SUBJECT } from '@app/shared/nat-stream/balance-failed-stream.types'
import { BalanceUpdatedData, BalanceFailedData } from './balance-event-publisher.types'
import { BalanceUpdatedEvent, BalanceFailedEvent } from '@app/shared/services/ledger/v1'
import { Injectable, Logger } from '@nestjs/common'
import { TxContext } from '@app/shared'
import { OutboxRepository } from '../../repository/outbox/outbox.repository'

@Injectable()
export class BalanceEventPublisher {
  private readonly logger: Logger = new Logger(BalanceEventPublisher.name)

  constructor(
    private readonly source: CoreJetstreamDataSource,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  isSuccessEvent(event: string) {
    return event === BalanceUpdatedEvent.EVENT_NAME
  }

  isFailedEvent(event: string) {
    return event === BalanceFailedEvent.EVENT_NAME
  }

  async enqueueSuccess(data: BalanceUpdatedData, ctx: TxContext): Promise<void> {
    const payload = new BalanceUpdatedEvent(
      data.uniqueKey,
      data.changes.map((item) => ({
        ...item,
        amount: item.amount.toString(),
      })),
    )
    await this.outboxRepository.create(
      {
        id: payload.uniqueKey,
        event: BalanceUpdatedEvent.EVENT_NAME,
        payload: JSON.stringify(payload),
      },
      ctx,
    )
  }

  async enqueueFailed(data: BalanceFailedData, ctx: TxContext): Promise<void> {
    const payload = new BalanceFailedEvent(
      data.uniqueKey,
      data.changes.map((item) => ({
        ...item,
        amount: item.amount.toString(),
      })),
      data.errors,
    )

    await this.outboxRepository.create(
      {
        id: payload.uniqueKey,
        event: BalanceFailedEvent.EVENT_NAME,
        payload: JSON.stringify(payload),
      },
      ctx,
    )
  }

  async publishSuccess(data: BalanceUpdatedEvent): Promise<void> {
    await this.source.publish(BALANCE_UPDATED_STREAM_SUBJECT, data)
  }

  async publishFailed(data: BalanceFailedEvent): Promise<void> {
    await this.source.publish(BALANCE_FAILED_STREAM_SUBJECT, data)
  }
}
