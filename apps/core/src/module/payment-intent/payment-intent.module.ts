import { Module } from '@nestjs/common'
import { ExternalIntegrationEventModule } from './listener/external-integration/external-integration-event.module'
import { PaymentLedgerEventListenerModule } from './listener/ledger/payment-ledger-event-listener.module'

@Module({
  imports: [ExternalIntegrationEventModule, PaymentLedgerEventListenerModule],
})
export class PaymentIntentModule {}
