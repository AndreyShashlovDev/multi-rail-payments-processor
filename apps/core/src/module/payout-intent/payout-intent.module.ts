import { Module } from '@nestjs/common'
import { ExternalIntegrationEventListenerModule } from './listener/external-integration/external-integration-event-listener.module'
import { LedgerEventListenerModule } from './listener/ledger/ledger-event-listener.module'

@Module({
  imports: [ExternalIntegrationEventListenerModule, LedgerEventListenerModule],
})
export class PayoutIntentModule {}
