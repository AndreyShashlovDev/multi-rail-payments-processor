import { Module } from '@nestjs/common'
import { PayoutController } from './payout.controller'
import { LedgerRepositoryModule } from '../../../data/repository/ledger/ledger-repository.module'
import { ChangePayoutStatusInteractorModule } from '../../../module/payout-intent/interactor/change-payout-status/change-payout-status-interactor.module'
import { CreatePayoutIntentInteractorModule } from '../../../module/payout-intent/interactor/create-payout-intent/create-payout-intent-interactor.module'
import { ExternalIntegrationRepositoryModule } from '../../../data/repository/external-integration/external-integration-repository.module'
import { PayoutInboxTransferRepositoryModule } from '../../../data/repository/payout-inbox-transfer/payout-inbox-transfer-repository.module'
import { ProcessPayoutTransactionInteractorModule } from '../../../module/payout-intent/interactor/process-payout-transaction/process-payout-transaction-interactor.module'

@Module({
  imports: [
    LedgerRepositoryModule,
    PayoutInboxTransferRepositoryModule,
    ExternalIntegrationRepositoryModule,
    ChangePayoutStatusInteractorModule,
    CreatePayoutIntentInteractorModule,
    ProcessPayoutTransactionInteractorModule,
  ],
  controllers: [PayoutController],
})
export class PayoutControllerModule {}
