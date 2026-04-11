import { Module } from '@nestjs/common'
import { PayoutController } from './payout.controller'
import { LedgerRepositoryModule } from '../../../data/repository/ledger/ledger-repository.module'
import {
  ChangePayoutStatusInteractorModule,
} from '../../../module/payout-intent/interactor/change-payout-status/change-payout-status-interactor.module'
import {
  CreatePayoutIntentInteractorModule,
} from '../../../module/payout-intent/interactor/create-payout-intent/create-payout-intent-interactor.module'
import {
  ProcessPayoutTransactionInteractorModule,
} from '../../../module/payout-intent/interactor/process-payout-transaction/process-payout-transaction-interactor.module'
import {
  ExternalIntegrationRepositoryModule,
} from '../../../data/repository/external-integration/external-integration-repository.module'

@Module({
  imports: [
    LedgerRepositoryModule,
    ChangePayoutStatusInteractorModule,
    CreatePayoutIntentInteractorModule,
    ProcessPayoutTransactionInteractorModule,
    ExternalIntegrationRepositoryModule,
  ],
  controllers: [PayoutController],
})
export class PayoutControllerModule {}
