import { BaseNatsService, transactionConsumer, IntegrationType, TRANSACTION_STREAM } from '@app/shared'
import { Injectable } from '@nestjs/common'
import type { NatsConfig } from '../../../../config'
import { TransactionEvent } from '@app/shared/services/external-integration/v1'
import { TRANSFER_INTENT_STREAM } from '@app/shared/nat-stream/transfer-intent-stream.types'

export interface IntegrationJetstreamHandler {
  transactionEventHandler(event: TransactionEvent): Promise<void>
}

@Injectable()
export class IntegrationJetstreamDataSource extends BaseNatsService {
  private handler: IntegrationJetstreamHandler | null = null

  constructor(config: NatsConfig) {
    super(config.url)
  }

  protected async setupStreams(): Promise<void> {
    await this.ensureStream(TRANSACTION_STREAM)
    await this.ensureStream(TRANSFER_INTENT_STREAM)

    for (const integration of Object.values(IntegrationType)) {
      await this.ensureConsumer(transactionConsumer(integration))
    }
  }

  setupHandler(handler: IntegrationJetstreamHandler | null): void {
    this.handler = handler
  }

  async onModuleInit(): Promise<void> {
    await super.onModuleInit()

    for (const integration of Object.values(IntegrationType)) {
      await this.startConsuming<TransactionEvent>(transactionConsumer(integration), async (data) => {
        if (this.handler) {
          await this.handler?.transactionEventHandler(data)
        }
      })
    }
  }
}
