import { TRANSACTION_STREAM, BaseNatsService, SignatureService } from '@app/shared'
import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import type { NatsConfig } from '../../../config'
import { TransferIntentCreateEvent } from '@app/shared/services/external-integration/v1'
import {
  transferIntentConsumer,
  TransferIntentEventType,
  TRANSFER_INTENT_STREAM,
} from '@app/shared/nat-stream/transfer-intent-stream.types'
import { TransferIntentHeldEvent } from '@app/shared/services/external-integration/v1/event/transfer-intent-held.event'
import { SignedEnvelopeEvent, JsonObject } from '@app/types'

export type TransferIntentIncomingEventType = TransferIntentCreateEvent | TransferIntentHeldEvent

export interface CoreJetstreamHandler {
  transferIntentEventHandler(
    type: TransferIntentEventType,
    event: JsonObject<TransferIntentIncomingEventType>,
  ): Promise<void>
}

const TRANSFER_INTENT_SUBSCRIPTION_TYPES: ReadonlyArray<TransferIntentEventType> = ['create', 'update', 'held']

@Injectable()
export class CoreJetstreamDataSource extends BaseNatsService implements OnApplicationBootstrap {
  private handler: CoreJetstreamHandler | null = null

  constructor(
    config: NatsConfig,
    private readonly signatureService: SignatureService,
  ) {
    super(config.url)
  }

  protected async setupStreams(): Promise<void> {
    await this.ensureStream(TRANSACTION_STREAM)
    await this.ensureStream(TRANSFER_INTENT_STREAM)

    for (const type of TRANSFER_INTENT_SUBSCRIPTION_TYPES) {
      await this.ensureConsumer(transferIntentConsumer(type))
    }
  }

  setupHandler(handler: CoreJetstreamHandler | null): void {
    this.handler = handler
  }

  async onApplicationBootstrap(): Promise<void> {
    for (const type of TRANSFER_INTENT_SUBSCRIPTION_TYPES) {
      await this.startConsuming<JsonObject<SignedEnvelopeEvent<TransferIntentIncomingEventType>>>(
        transferIntentConsumer(type),
        async (data) => {
          if (this.handler) {
            this.signatureService.verifyEnvelop(data)

            await this.handler.transferIntentEventHandler(type, data.meta.payload)
          }
        },
      )
    }
  }
}
