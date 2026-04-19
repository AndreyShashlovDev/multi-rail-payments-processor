import { Module } from '@nestjs/common'
import { CreatePayoutIntentInteractor } from './create-payout-intent.interactor'
import { PayoutIntentRepositoryModule } from '../../../../data/repository/payout-intent/payout-intent-repository.module'
import { ExternalIntegrationRepositoryModule } from '../../../../data/repository/external-integration/external-integration-repository.module'
import { LedgerRepositoryModule } from '../../../../data/repository/ledger/ledger-repository.module'
import { IntegrationAccountLinkRepositoryModule } from '../../../../data/repository/integration-account-link/integration-account-link-repository.module'
import { TxContextModule } from '../../../../shared/tx-context/tx-context.module'

@Module({
  imports: [
    TxContextModule,
    PayoutIntentRepositoryModule,
    ExternalIntegrationRepositoryModule,
    LedgerRepositoryModule,
    IntegrationAccountLinkRepositoryModule,
  ],
  providers: [CreatePayoutIntentInteractor],
  exports: [CreatePayoutIntentInteractor],
})
export class CreatePayoutIntentInteractorModule {}
