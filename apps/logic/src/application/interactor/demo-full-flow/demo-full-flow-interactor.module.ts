import { Module, Logger } from '@nestjs/common'
import { DemoFullFlowInteractor } from './demo-full-flow.interactor'
import {
  IntegrationAccountLinkRepositoryModule,
} from '../../../data/repository/integration-account-link/integration-account-link-repository.module'
import { AccountRepositoryModule } from '../../../data/repository/account/account-repository.module'
import { LedgerRepositoryModule } from '../../../data/repository/ledger/ledger-repository.module'
import {
  CreatePaymentIntentInteractorModule,
} from '../../../module/payment-intent/interactor/create-payment-intent/create-payment-intent-interactor.module'
import {
  CreatePayoutIntentInteractorModule,
} from '../../../module/payout-intent/interactor/create-payout-intent/create-payout-intent-interactor.module'

@Module({
  imports: [
    IntegrationAccountLinkRepositoryModule,
    AccountRepositoryModule,
    LedgerRepositoryModule,
    CreatePaymentIntentInteractorModule,
    CreatePayoutIntentInteractorModule,
  ],
  providers: [Logger, DemoFullFlowInteractor],
  exports: [DemoFullFlowInteractor],
})
export class DemoFullFlowInteractorModule {}
