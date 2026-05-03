import { LedgerJetstreamDataSource } from '../../data-source/nats-jetstream/ledger/ledger-jetstream.data-source'
import { Injectable, Logger } from '@nestjs/common'
import { OutboxRepository } from '../../repository/outbox/outbox.repository'
import { TxContext } from '@app/shared'
import { BalanceChangeRequestEvent } from '@app/shared/services/ledger/v1'
import { balanceChangeSubject } from '@app/shared/nat-stream/balance-change-stream.types'
import { LedgerPublisherMapper } from './ledger-publisher.mapper'
import { ChangeBalanceData } from './ledger-publisher.types'
import { validateSync } from 'class-validator'
import { SignatureService } from '@app/shared/signature/signature.service'
import { JsonObject } from '@app/types'

@Injectable()
export class LedgerPublisher {
  private readonly logger: Logger = new Logger(LedgerPublisher.name)

  constructor(
    private readonly source: LedgerJetstreamDataSource,
    private readonly outboxRepository: OutboxRepository,
    private readonly signatureService: SignatureService,
  ) {}

  isSupportEvent(event: string): boolean {
    return event === BalanceChangeRequestEvent.EVENT_NAME
  }

  async enqueue(data: ChangeBalanceData, ctx: TxContext): Promise<void> {
    const events = Map.groupBy(data.changes, (item) => item.integration)

    const payload = Array.from(events.entries()).map(([integration, changes]) => {
      const transformed = changes.map((item) => LedgerPublisherMapper.balanceChangeToEvent(item))
      const item = new BalanceChangeRequestEvent(`${data.idempotencyKey}:${integration}`, integration, transformed)

      const errors = validateSync(item)
      if (errors.length) throw new Error(`Invalid BalanceChangeRequestEvent structure ${JSON.stringify(errors)}`)

      return item
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

  async publish(data: ReadonlyArray<JsonObject<BalanceChangeRequestEvent>>): Promise<void> {
    for (const request of data) {
      const envelope = this.signatureService.createSignedEnvelop(request)

      await this.source.publish(balanceChangeSubject(request.integration), envelope)
    }
  }
}
