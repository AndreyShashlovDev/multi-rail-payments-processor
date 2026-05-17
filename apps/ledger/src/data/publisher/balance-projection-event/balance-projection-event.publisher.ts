import { CoreJetstreamDataSource } from '../../data-source/nats-jetstream/core/core-jetstream-data-source.service'
import { Injectable, Logger } from '@nestjs/common'
import { SignatureService, TxContext } from '@app/shared'
import { validateSync } from 'class-validator'
import { BalanceProjectionUpdatedData } from './balance-projection-event-publisher.types'
import {
  BalanceProjectionUpdatedEvent,
  ProjectionEventData,
} from '@app/shared/services/ledger/v1/event/balance-projection-updated.event'
import { Iso8601StringDate, JsonObject } from '@app/types'
import { OutboxRepository } from '../../repository/outbox/outbox.repository'
import { randomUUID } from 'node:crypto'
import { BALANCE_PROJECTION_UPDATED_SUBJECT } from '@app/shared/nat-stream/balance-projection-update-stream.types'

@Injectable()
export class BalanceProjectionEventPublisher {
  private readonly logger: Logger = new Logger(BalanceProjectionEventPublisher.name)

  constructor(
    private readonly source: CoreJetstreamDataSource,
    private readonly outboxRepository: OutboxRepository,
    private readonly signatureService: SignatureService,
  ) {}

  isSupportedEvent(event: string): boolean {
    return event === BalanceProjectionUpdatedEvent.EVENT_NAME
  }

  async enqueue(data: BalanceProjectionUpdatedData, ctx: TxContext): Promise<void> {
    const projections = data.projections.map(
      (item) => new ProjectionEventData(item.account, item.integration, item.currency, item.available.toString()),
    )
    const payload = new BalanceProjectionUpdatedEvent(randomUUID(), projections, Iso8601StringDate.create(data.date))

    const errors = validateSync(payload)
    if (errors.length) throw new Error(`Invalid BalanceFailedEvent structure ${JSON.stringify(errors)}`)

    await this.outboxRepository.create(
      {
        id: payload.uniqueKey,
        event: BalanceProjectionUpdatedEvent.EVENT_NAME,
        payload: JSON.stringify(payload),
      },
      ctx,
    )
  }

  async publish(data: JsonObject<BalanceProjectionUpdatedEvent>): Promise<void> {
    const envelope = this.signatureService.createSignedEnvelop(data)

    await this.source.publish(BALANCE_PROJECTION_UPDATED_SUBJECT, envelope)
  }
}
