import { CoreJetstreamDataSource } from '../../data-source/nats-jetstream/core-jetstream.data-source'
import { Injectable } from '@nestjs/common'
import { transactionSubject, SignatureService } from '@app/shared'
import { TransactionEventPublisherMapper } from './transaction-event-publisher.mapper'
import { TransactionEventData } from './transaction-event-publisher.types'
import { OutboxRepository } from '../../repository/outbox/outbox.repository'
import { TxContext } from '@app/shared/types/tx-context.type'
import { TransactionEvent } from '@app/shared/services/external-integration/v1'
import { validateSync } from 'class-validator'

@Injectable()
export class TransactionEventPublisher {
  constructor(
    private readonly source: CoreJetstreamDataSource,
    private readonly outboxRepository: OutboxRepository,
    private readonly signatureService: SignatureService,
  ) {}

  async enqueue(tx: TransactionEventData, ctx: TxContext): Promise<void> {
    const payload = TransactionEventPublisherMapper.transactionToEvent(tx)

    const errors = validateSync(payload)
    if (errors.length) throw new Error(`Invalid TransactionEvent structure ${JSON.stringify(errors)}`)

    await this.outboxRepository.create(
      {
        id: payload.uniqueKey,
        event: TransactionEvent.EVENT_NAME,
        payload: JSON.stringify(payload),
      },
      ctx,
    )
  }

  public isSupportEvent(event: string): boolean {
    return event === TransactionEvent.EVENT_NAME
  }

  async publish(event: TransactionEvent): Promise<void> {
    const envelop = this.signatureService.createSignedEnvelop(event)

    await this.source.publish(transactionSubject(event.integration), envelop)
  }
}
