import { Module } from '@nestjs/common'
import { CreatePayoutIntentInteractor } from './create-payout-intent.interactor'
import { PayoutIntentRepositoryModule } from '../../../../data/repository/payout-intent/payout-intent-repository.module'
import { ExternalIntegrationRepositoryModule } from '../../../../data/repository/external-integration/external-integration-repository.module'
import { LedgerRepositoryModule } from '../../../../data/repository/ledger/ledger-repository.module'
import { IntegrationAccountLinkRepositoryModule } from '../../../../data/repository/integration-account-link/integration-account-link-repository.module'
import { OutboxTxContextModule } from '../../../../shared/tx-context/outbox-tx-context.module'
import { ExternalIntegrationPublisherModule } from '../../../../data/publisher/external-integration/external-integration-publisher.module'
import { CurrencyRepositoryModule } from '../../../../data/repository/currency/currency-repository.module'

@Module({
  imports: [
    OutboxTxContextModule,
    PayoutIntentRepositoryModule,
    ExternalIntegrationRepositoryModule,
    ExternalIntegrationPublisherModule,
    LedgerRepositoryModule,
    IntegrationAccountLinkRepositoryModule,
    CurrencyRepositoryModule,
  ],
  providers: [CreatePayoutIntentInteractor],
  exports: [CreatePayoutIntentInteractor],
})
export class CreatePayoutIntentInteractorModule {}
