import { Module } from '@nestjs/common'
import { DemoFullFlowInteractor } from './demo-full-flow.interactor'
import { IntegrationAccountLinkRepositoryModule } from '../../../data/repository/integration-account-link/integration-account-link-repository.module'
import { AccountRepositoryModule } from '../../../data/repository/account/account-repository.module'
import { LedgerRepositoryModule } from '../../../data/repository/ledger/ledger-repository.module'
import { CreatePaymentIntentInteractorModule } from '../../../module/payment-intent/interactor/create-payment-intent/create-payment-intent-interactor.module'
import { CreatePayoutIntentInteractorModule } from '../../../module/payout-intent/interactor/create-payout-intent/create-payout-intent-interactor.module'
import { LedgerPublisherModule } from '../../../data/publisher/ledger/ledger-publisher.module'
import { OutboxTxContextModule } from '../../../shared/tx-context/outbox-tx-context.module'

@Module({
  imports: [
    OutboxTxContextModule,
    IntegrationAccountLinkRepositoryModule,
    AccountRepositoryModule,
    LedgerRepositoryModule,
    LedgerPublisherModule,
    CreatePaymentIntentInteractorModule,
    CreatePayoutIntentInteractorModule,
  ],
  providers: [DemoFullFlowInteractor],
  exports: [DemoFullFlowInteractor],
})
export class DemoFullFlowInteractorModule {}
