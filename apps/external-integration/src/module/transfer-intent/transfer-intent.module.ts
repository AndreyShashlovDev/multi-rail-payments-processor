import { Module } from '@nestjs/common'
import { IntentEventListenerModule } from './listener/intent-event/intent-event-listener.module'

@Module({
  imports: [IntentEventListenerModule],
  providers: [],
})
export class TransferIntentModule {}
