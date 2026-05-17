import { Module } from '@nestjs/common'
import { LedgerConsumerModule } from '../../../../data/consumer/ledger/ledger-consumer.module'
import { IntegrationAccountBalanceRepositoryModule } from '../../../../data/repository/integration-account-balance/integration-account-balance-repository.module'
import { IntegrationAccountLedgerEventListener } from './integration-account-ledger-event.listener'

@Module({
  imports: [LedgerConsumerModule, IntegrationAccountBalanceRepositoryModule],
  providers: [IntegrationAccountLedgerEventListener],
})
export class IntegrationAccountLedgerEventListenerModule {}
