import {
  BaseNatsService,
  transactionConsumer,
  IntegrationType,
  TRANSACTION_STREAM,
  SignatureService,
  TransactionEventHandler,
  TransactionEventSource,
} from '@app/shared'
import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import type { NatsConfig } from '../../../../config'
import { TransactionEvent } from '@app/shared/services/external-integration/v1'
import { TRANSFER_INTENT_STREAM } from '@app/shared/nat-stream/transfer-intent-stream.types'
import { JsonObject, SignedEnvelopeEvent } from '@app/types'

@Injectable()
export class IntegrationJetstreamDataSource
  extends BaseNatsService
  implements TransactionEventSource, OnApplicationBootstrap
{
  private handler: TransactionEventHandler | null = null

  constructor(
    config: NatsConfig,
    private readonly signatureService: SignatureService,
  ) {
    super(config.url)
  }

  protected async setupStreams(): Promise<void> {
    await this.ensureStream(TRANSACTION_STREAM)
    await this.ensureStream(TRANSFER_INTENT_STREAM)

    for (const integration of Object.values(IntegrationType)) {
      await this.ensureConsumer(transactionConsumer(integration))
    }
  }

  setupHandler(handler: TransactionEventHandler | null): void {
    this.handler = handler
  }

  async onApplicationBootstrap(): Promise<void> {
    for (const integration of Object.values(IntegrationType)) {
      await this.startConsuming<JsonObject<SignedEnvelopeEvent<TransactionEvent>>>(
        transactionConsumer(integration),
        async (data) => {
          if (this.handler) {
            this.signatureService.verifyEnvelop(data)

            await this.handler.transactionEventHandler(data.meta.payload)
          }
        },
      )
    }
  }
}
