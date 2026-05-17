import { Module } from '@nestjs/common'
import { IntegrationAccountLedgerEventListenerModule } from './listener/ledger/integration-account-ledger-event-listener.module'

@Module({
  imports: [IntegrationAccountLedgerEventListenerModule],
})
export class IntegrationAccountModule {}
