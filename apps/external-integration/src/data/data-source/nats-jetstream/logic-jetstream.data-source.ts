import { TRANSACTION_STREAM, BaseNatsService } from '@app/shared'
import { Injectable } from '@nestjs/common'
import type { NatsConfig } from '../../../config'
import { TransferIntentCreateEvent } from '@app/shared/services/external-integration/v1'
import {
  transferIntentConsumer,
  TransferIntentEventType,
  TRANSFER_INTENT_STREAM,
} from '@app/shared/nat-stream/transfer-intent-stream.types'
import { TransferIntentHeldEvent } from '@app/shared/services/external-integration/v1/event/transfer-intent-held.event'

export type TransferIntentResponseType = TransferIntentCreateEvent | TransferIntentHeldEvent

export interface LogicJetstreamHandler {
  transferIntentEventHandler(type: TransferIntentEventType, event: TransferIntentResponseType): Promise<void>
}

const TRANSFER_INTENT_SUBSCRIPTION_TYPES: ReadonlyArray<TransferIntentEventType> = ['create', 'update', 'held']

@Injectable()
export class LogicJetstreamDataSource extends BaseNatsService {
  private handler: LogicJetstreamHandler | null = null

  constructor(config: NatsConfig) {
    super(config.url)
  }

  protected async setupStreams(): Promise<void> {
    await this.ensureStream(TRANSACTION_STREAM)
    await this.ensureStream(TRANSFER_INTENT_STREAM)

    for (const type of TRANSFER_INTENT_SUBSCRIPTION_TYPES) {
      await this.ensureConsumer(transferIntentConsumer(type))
    }
  }

  setupHandler(handler: LogicJetstreamHandler | null): void {
    this.handler = handler
  }

  async onModuleInit(): Promise<void> {
    await super.onModuleInit()

    for (const type of TRANSFER_INTENT_SUBSCRIPTION_TYPES) {
      await this.startConsuming<TransferIntentCreateEvent>(transferIntentConsumer(type), async (data) => {
        if (this.handler) {
          await this.handler?.transferIntentEventHandler(type, data)
        }
      })
    }
  }
}
