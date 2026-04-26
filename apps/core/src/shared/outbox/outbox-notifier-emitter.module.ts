import { Module } from '@nestjs/common'
import { OutboxNotifierEmitter } from './outbox-notifier-emitter'

@Module({
  imports: [],
  providers: [OutboxNotifierEmitter],
  exports: [OutboxNotifierEmitter],
})
export class OutboxNotifierEmitterModule {}
