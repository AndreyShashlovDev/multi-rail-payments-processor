import { CoreJetstreamDataSource } from '../../data-source/nats-jetstream/core/core-jetstream-data-source.service'
import { BALANCE_UPDATED_STREAM_SUBJECT } from '@app/shared/nat-stream/balance-updated-stream.types'
import { BALANCE_FAILED_STREAM_SUBJECT } from '@app/shared/nat-stream/balance-failed-stream.types'
import { BalanceUpdatedEvent, BalanceFailedEvent } from '@app/shared/services/ledger/v1'
import { Injectable, Logger } from '@nestjs/common'
import { TxContext, SignatureService } from '@app/shared'
import { OutboxRepository } from '../../repository/outbox/outbox.repository'
import { validateSync } from 'class-validator'
import { JsonObject } from '@app/types'

@Injectable()
export class BalanceEventPublisher {
  private readonly logger: Logger = new Logger(BalanceEventPublisher.name)

  constructor(
    private readonly source: CoreJetstreamDataSource,
    private readonly outboxRepository: OutboxRepository,
    private readonly signatureService: SignatureService,
  ) {}

  isSuccessEvent(event: string) {
    return event === BalanceUpdatedEvent.EVENT_NAME
  }

  isFailedEvent(event: string) {
    return event === BalanceFailedEvent.EVENT_NAME
  }

  async enqueueSuccess(payload: BalanceUpdatedEvent, ctx: TxContext): Promise<void> {
    const errors = validateSync(payload)
    if (errors.length) throw new Error(`Invalid BalanceUpdatedEvent structure ${JSON.stringify(errors)}`)

    await this.outboxRepository.create(
      {
        id: payload.uniqueKey,
        event: BalanceUpdatedEvent.EVENT_NAME,
        payload: JSON.stringify(payload),
      },
      ctx,
    )
  }

  async enqueueFailed(payload: BalanceFailedEvent, ctx: TxContext): Promise<void> {
    const errors = validateSync(payload)
    if (errors.length) throw new Error(`Invalid BalanceFailedEvent structure ${JSON.stringify(errors)}`)

    await this.outboxRepository.create(
      {
        id: payload.uniqueKey,
        event: BalanceFailedEvent.EVENT_NAME,
        payload: JSON.stringify(payload),
      },
      ctx,
    )
  }

  async publishSuccess(data: JsonObject<BalanceUpdatedEvent>): Promise<void> {
    const envelope = this.signatureService.createSignedEnvelop(data)

    await this.source.publish(BALANCE_UPDATED_STREAM_SUBJECT, envelope)
  }

  async publishFailed(data: JsonObject<BalanceFailedEvent>): Promise<void> {
    const envelope = this.signatureService.createSignedEnvelop(data)

    await this.source.publish(BALANCE_FAILED_STREAM_SUBJECT, envelope)
  }
}
