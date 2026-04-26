import { Module } from '@nestjs/common'
import { LedgerEventListenerModule } from './listener/ledger/ledger-event-listener.module'

@Module({
  imports: [LedgerEventListenerModule],
})
export class EscrowModule {}
