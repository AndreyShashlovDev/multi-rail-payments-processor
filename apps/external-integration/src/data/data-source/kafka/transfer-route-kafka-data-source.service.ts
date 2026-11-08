import type { KafkaConfig, KafkaTopicSet } from '@app/shared'
import {
  BaseKafkaService,
  SignatureService,
  TRANSFER_ROUTE_COMMAND_TOPIC_SET,
  TRANSFER_ROUTE_COMPLETED_TOPIC_SET,
  TRANSFER_ROUTE_FAILED_TOPIC_SET,
} from '@app/shared'
import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { BasicEvent, JsonObject, SignedEnvelopeEvent } from '@app/types'

// executor consumes commands, orchestrator consumes step events
export type TransferRouteRole = 'executor' | 'orchestrator'

interface TransferRouteHandlerRegistration {
  readonly topicSet: KafkaTopicSet
  readonly role: TransferRouteRole
  readonly handler: (payload: JsonObject<BasicEvent>) => Promise<void>
}

/**
 * Transport between the transfer orchestrator and the executors. A topic is consumed only when
 * a handler is set up for it, so a service consumes only the side it plays.
 */
@Injectable()
export class TransferRouteKafkaDataSource extends BaseKafkaService implements OnApplicationBootstrap {
  private static readonly TOPIC_SETS: ReadonlyArray<KafkaTopicSet> = [
    TRANSFER_ROUTE_COMMAND_TOPIC_SET,
    TRANSFER_ROUTE_COMPLETED_TOPIC_SET,
    TRANSFER_ROUTE_FAILED_TOPIC_SET,
  ]

  private readonly registrations = new Map<string, TransferRouteHandlerRegistration>()

  constructor(
    config: KafkaConfig,
    private readonly groupIdPrefix: string,
    private readonly signatureService: SignatureService,
  ) {
    super(config)
  }

  protected async setupTopics(): Promise<void> {
    for (const topicSet of TransferRouteKafkaDataSource.TOPIC_SETS) {
      await this.ensureTopic(topicSet.topic)
      await this.ensureTopic(topicSet.dlq)
    }
  }

  setupHandler<T extends BasicEvent>(
    topicSet: KafkaTopicSet,
    role: TransferRouteRole,
    handler: (payload: JsonObject<T>) => Promise<void>,
  ): void {
    this.registrations.set(topicSet.name, {
      topicSet,
      role,
      handler: handler,
    })
  }

  async onApplicationBootstrap(): Promise<void> {
    for (const { topicSet, role, handler } of this.registrations.values()) {
      await this.startConsuming<JsonObject<SignedEnvelopeEvent<JsonObject<BasicEvent>>>>(
        topicSet.consumer(`${this.groupIdPrefix}-transfer-route-${role}-${topicSet.name}`),
        async (data) => {
          this.signatureService.verifyEnvelop(data)

          await handler(data.meta.payload)
        },
      )
    }
  }
}
