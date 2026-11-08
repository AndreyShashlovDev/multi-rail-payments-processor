import { Injectable } from '@nestjs/common'
import {
  KafkaTopicSet,
  SignatureService,
  TRANSFER_ROUTE_COMMAND_TOPIC_SET,
  TRANSFER_ROUTE_COMPLETED_TOPIC_SET,
  TRANSFER_ROUTE_FAILED_TOPIC_SET,
} from '@app/shared'
import { TxContext } from '@app/shared/types/tx-context.type'
import {
  ExecuteTransferRouteCommand,
  TransferRouteCompletedEvent,
  TransferRouteFailedEvent,
} from '@app/shared/services/transfer-execution/v1'
import { BasicEvent, JsonObject } from '@app/types'
import { validateSync } from 'class-validator'
import { OutboxRepository } from '../../repository/outbox/outbox.repository'
import { TransferRouteKafkaDataSource } from '../../data-source/kafka/transfer-route-kafka-data-source.service'

interface TransferRouteMessageRoute {
  readonly topicSet: KafkaTopicSet
  readonly key: (payload: JsonObject<BasicEvent>) => string
}

@Injectable()
export class TransferRoutePublisher {
  private static readonly ROUTES: ReadonlyMap<string, TransferRouteMessageRoute> = new Map([
    // keyed by `${executionType}:${integration}`: a per-network executor owns its partitions
    [
      ExecuteTransferRouteCommand.EVENT_NAME,
      {
        topicSet: TRANSFER_ROUTE_COMMAND_TOPIC_SET,
        key: (payload) => {
          const command = payload as JsonObject<ExecuteTransferRouteCommand>
          return `${command.executionType}:${command.integration}`
        },
      },
    ],
    [
      TransferRouteCompletedEvent.EVENT_NAME,
      {
        topicSet: TRANSFER_ROUTE_COMPLETED_TOPIC_SET,
        key: (payload) => String((payload as JsonObject<TransferRouteCompletedEvent>).transferRouteId),
      },
    ],
    [
      TransferRouteFailedEvent.EVENT_NAME,
      {
        topicSet: TRANSFER_ROUTE_FAILED_TOPIC_SET,
        key: (payload) => String((payload as JsonObject<TransferRouteFailedEvent>).transferRouteId),
      },
    ],
  ])

  constructor(
    private readonly source: TransferRouteKafkaDataSource,
    private readonly outboxRepository: OutboxRepository,
    private readonly signatureService: SignatureService,
  ) {}

  async enqueueExecute(command: ExecuteTransferRouteCommand, ctx: TxContext): Promise<void> {
    await this.enqueue(ExecuteTransferRouteCommand.EVENT_NAME, command, ctx)
  }

  async enqueueCompleted(event: TransferRouteCompletedEvent, ctx: TxContext): Promise<void> {
    await this.enqueue(TransferRouteCompletedEvent.EVENT_NAME, event, ctx)
  }

  async enqueueFailed(event: TransferRouteFailedEvent, ctx: TxContext): Promise<void> {
    await this.enqueue(TransferRouteFailedEvent.EVENT_NAME, event, ctx)
  }

  isSupportEvent(event: string): boolean {
    return TransferRoutePublisher.ROUTES.has(event)
  }

  async publish(event: string, payload: JsonObject<BasicEvent>): Promise<void> {
    const route = TransferRoutePublisher.ROUTES.get(event)

    if (!route) throw new Error(`Unsupported transfer route message: ${event}`)

    const envelop = this.signatureService.createSignedEnvelop(payload)

    await this.source.publish(route.topicSet.name, route.key(payload), envelop)
  }

  private async enqueue(event: string, payload: BasicEvent, ctx: TxContext): Promise<void> {
    const errors = validateSync(payload)
    if (errors.length) throw new Error(`Invalid ${event} structure ${JSON.stringify(errors)}`)

    await this.outboxRepository.create({ id: payload.uniqueKey, event, payload: JSON.stringify(payload) }, ctx)
  }
}
