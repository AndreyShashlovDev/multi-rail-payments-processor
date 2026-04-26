import { OnEvent } from '@nestjs/event-emitter'
import { Injectable } from '@nestjs/common'
import { OutboxPublishInteractor } from '../../interactor/outbox-publish/outbox-publish.interactor'
import { OutboxNotifierEmitter } from '../../../shared/outbox/outbox-notifier-emitter'

@Injectable()
export class OutboxPublishListener {
  constructor(private readonly outboxPublishInteractor: OutboxPublishInteractor) {}

  @OnEvent(OutboxNotifierEmitter.EMIT_EVENT_NAME)
  async handle() {
    await this.outboxPublishInteractor.execute()
  }
}
