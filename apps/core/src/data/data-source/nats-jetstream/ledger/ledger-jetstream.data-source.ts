import { BaseNatsService } from '@app/shared'
import { Injectable } from '@nestjs/common'
import type { NatsConfig } from '../../../../config'
import { BALANCE_CHANGE_STREAM } from '@app/shared/nat-stream/balance-change-stream.types'
import { BALANCE_UPDATED_CONSUMER, BALANCE_UPDATED_STREAM } from '@app/shared/nat-stream/balance-updated-stream.types'
import { BalanceUpdatedEvent } from '@app/shared/services/ledger/v1'

export interface LedgerJetstreamHandler {
  balanceUpdatedEventHandler(event: BalanceUpdatedEvent): Promise<void>
}

@Injectable()
export class LedgerJetstreamDataSource extends BaseNatsService {
  private handler: LedgerJetstreamHandler | null = null

  constructor(config: NatsConfig) {
    super(config.url)
  }

  protected async setupStreams(): Promise<void> {
    await this.ensureStream(BALANCE_CHANGE_STREAM)
    await this.ensureStream(BALANCE_UPDATED_STREAM)

    await this.ensureConsumer(BALANCE_UPDATED_CONSUMER)
  }

  setupHandler(handler: LedgerJetstreamHandler | null): void {
    this.handler = handler
  }

  async onModuleInit(): Promise<void> {
    await super.onModuleInit()

    await this.startConsuming<BalanceUpdatedEvent>(BALANCE_UPDATED_CONSUMER, async (data) => {
      if (this.handler) {
        await this.handler?.balanceUpdatedEventHandler(data)
      }
    })
  }
}
