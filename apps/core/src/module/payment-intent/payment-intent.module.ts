import { Module } from '@nestjs/common'
import { ExternalIntegrationEventModule } from './listener/external-integration/external-integration-event.module'
import { LedgerEventListenerModule } from './listener/ledger/ledger-event-listener.module'

@Module({
  imports: [ExternalIntegrationEventModule, LedgerEventListenerModule],
})
export class PaymentIntentModule {}
