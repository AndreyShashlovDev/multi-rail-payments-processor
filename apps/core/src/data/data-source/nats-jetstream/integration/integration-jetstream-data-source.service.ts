import {
  BaseNatsService,
  transactionConsumer,
  IntegrationType,
  TRANSACTION_STREAM,
  SignatureService,
} from '@app/shared'
import { Injectable } from '@nestjs/common'
import type { NatsConfig } from '../../../../config'
import { TransactionEvent } from '@app/shared/services/external-integration/v1'
import { TRANSFER_INTENT_STREAM } from '@app/shared/nat-stream/transfer-intent-stream.types'
import { JsonObject, SignedEnvelopeEvent } from '@app/types'

export interface IntegrationJetstreamHandler {
  transactionEventHandler(event: JsonObject<TransactionEvent>): Promise<void>
}

@Injectable()
export class IntegrationJetstreamDataSource extends BaseNatsService {
  private handler: IntegrationJetstreamHandler | null = null

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

  setupHandler(handler: IntegrationJetstreamHandler | null): void {
    this.handler = handler
  }

  async onModuleInit(): Promise<void> {
    await super.onModuleInit()

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
