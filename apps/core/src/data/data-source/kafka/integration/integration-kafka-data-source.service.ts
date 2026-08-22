import {
  BaseKafkaService,
  SignatureService,
  TRANSACTION_DLQ_TOPIC,
  TRANSACTION_TOPIC,
  TransactionEventHandler,
  TransactionEventSource,
  transactionKafkaConsumer,
} from '@app/shared'
import type { KafkaConfig } from '@app/shared'
import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { TransactionEvent } from '@app/shared/services/external-integration/v1'
import { JsonObject, SignedEnvelopeEvent } from '@app/types'

/**
 * Kafka counterpart of IntegrationJetstreamDataSource — consumes the same
 * TransactionEvent envelope from the `transaction` topic (partitioned by
 * network/integration key) instead of NATS subjects, and drives the exact
 * same TransactionEventHandler.
 *
 * onModuleInit (inherited from BaseKafkaService) only connects and ensures
 * the topics exist. The actual consume loop — which starts invoking
 * business handlers — only starts in onApplicationBootstrap, once every
 * module in the app has finished its own onModuleInit. This avoids
 * processing a message before the rest of the app (other providers,
 * repositories, etc.) is fully wired up.
 *
 * No self-gating here on purpose: TransactionEventSourceModule only
 * imports this class's module at all when Kafka is actually the selected
 * transport, so this class is simply never constructed otherwise — a
 * connection that's never opened, not one that's opened and then told to
 * sit idle.
 */
@Injectable()
export class IntegrationKafkaDataSource
  extends BaseKafkaService
  implements TransactionEventSource, OnApplicationBootstrap
{
  private handler: TransactionEventHandler | null = null

  constructor(
    config: KafkaConfig,
    private readonly groupId: string,
    private readonly signatureService: SignatureService,
  ) {
    super(config)
  }

  protected async setupTopics(): Promise<void> {
    await this.ensureTopic(TRANSACTION_TOPIC)
    await this.ensureTopic(TRANSACTION_DLQ_TOPIC)
  }

  setupHandler(handler: TransactionEventHandler | null): void {
    this.handler = handler
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.startConsuming<JsonObject<SignedEnvelopeEvent<TransactionEvent>>>(
      transactionKafkaConsumer(this.groupId),
      async (data) => {
        if (this.handler) {
          this.signatureService.verifyEnvelop(data)

          await this.handler.transactionEventHandler(data.meta.payload)
        }
      },
    )
  }
}
