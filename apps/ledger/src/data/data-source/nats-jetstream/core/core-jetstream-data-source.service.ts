import { BaseNatsService, IntegrationType } from '@app/shared'
import { Injectable } from '@nestjs/common'
import type { NatsConfig } from '../../../../config'
import { balanceChangeConsumer, BALANCE_CHANGE_STREAM } from '@app/shared/nat-stream/balance-change-stream.types'
import { BALANCE_UPDATED_STREAM } from '@app/shared/nat-stream/balance-updated-stream.types'
import { BalanceChangeRequestEvent } from '@app/shared/services/ledger/v1'
import { BALANCE_FAILED_STREAM } from '@app/shared/nat-stream/balance-failed-stream.types'

export interface CoreJetstreamHandler {
  balanceChangeHandler(event: BalanceChangeRequestEvent): Promise<void>
}

@Injectable()
export class CoreJetstreamDataSource extends BaseNatsService {
  private handler: CoreJetstreamHandler | null

  constructor(config: NatsConfig) {
    super(config.url)
  }

  protected async setupStreams(): Promise<void> {
    await this.ensureStream(BALANCE_CHANGE_STREAM)
    await this.ensureStream(BALANCE_UPDATED_STREAM)
    await this.ensureStream(BALANCE_FAILED_STREAM)

    for (const integration of Object.values(IntegrationType)) {
      await this.ensureConsumer(balanceChangeConsumer(integration))
    }
  }

  setupHandler(handler: CoreJetstreamHandler | null): void {
    this.handler = handler
  }

  async onModuleInit(): Promise<void> {
    await super.onModuleInit()

    for (const integration of Object.values(IntegrationType)) {
      await this.startConsuming<BalanceChangeRequestEvent>(balanceChangeConsumer(integration), async (data) => {
        if (this.handler) {
          await this.handler?.balanceChangeHandler(data)
        }
      })
    }
  }
}
