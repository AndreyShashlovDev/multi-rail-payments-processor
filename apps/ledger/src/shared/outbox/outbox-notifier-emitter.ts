import { OutboxNotifier } from '@app/shared'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Injectable } from '@nestjs/common'

@Injectable()
export class OutboxNotifierEmitter implements OutboxNotifier {
  static readonly EMIT_EVENT_NAME = 'outbox.publish'

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async notify(): Promise<void> {
    await this.eventEmitter.emitAsync(OutboxNotifierEmitter.EMIT_EVENT_NAME)
  }
}
