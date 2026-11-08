import { Module } from '@nestjs/common'
import { IntentEventListenerModule } from './listener/intent-event/intent-event-listener.module'
import { TransferRouteEventListenerModule } from './listener/transfer-route-event/transfer-route-event-listener.module'

// Orchestrator: accepts transfer intents from Core, plans their steps (transfer routes)
// and drives them through the executors.
@Module({
  imports: [IntentEventListenerModule, TransferRouteEventListenerModule],
  providers: [],
})
export class TransferIntentModule {}
