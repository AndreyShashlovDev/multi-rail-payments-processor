import { LedgerJetstreamDataSource } from '../../data-source/nats-jetstream/ledger/ledger-jetstream.data-source'
import { Injectable, Logger } from '@nestjs/common'
import { OutboxRepository } from '../../repository/outbox/outbox.repository'
import { TxContext } from '@app/shared'
import { BalanceChangeRequestEvent } from '@app/shared/services/ledger/v1'
import { balanceChangeSubject } from '@app/shared/nat-stream/balance-change-stream.types'
import { LedgerPublisherMapper } from './ledger-publisher.mapper'
import { ChangeBalanceData } from './ledger-publisher.types'

@Injectable()
export class LedgerPublisher {
  private readonly logger: Logger = new Logger(LedgerPublisher.name)

  constructor(
    private readonly source: LedgerJetstreamDataSource,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  isSupportEvent(event: string): boolean {
    return event === BalanceChangeRequestEvent.EVENT_NAME
  }

  async enqueue(data: ChangeBalanceData, ctx: TxContext): Promise<void> {
    const events = Map.groupBy(data.changes, (item) => item.integration)

    const payload = Array.from(events.entries()).map(([integration, changes]) => {
      const transformed = changes.map((item) => LedgerPublisherMapper.balanceChangeToEvent(item))
      return new BalanceChangeRequestEvent(`${data.idempotencyKey}:${integration}`, integration, transformed)
    })

    await this.outboxRepository.create(
      {
        id: data.idempotencyKey,
        event: BalanceChangeRequestEvent.EVENT_NAME,
        payload: JSON.stringify(payload),
      },
      ctx,
    )
  }

  async publish(data: ReadonlyArray<BalanceChangeRequestEvent>): Promise<void> {
    for (const request of data) {
      await this.source.publish(balanceChangeSubject(request.integration), request)
    }
  }
}
