import { Module } from '@nestjs/common'
import { PayoutController } from './payout.controller'
import { LedgerRepositoryModule } from '../../../data/repository/ledger/ledger-repository.module'
import {
  ChangePayoutStatusInteractorModule,
} from '../../../module/payout-intent/interactor/change-payout-status/change-payout-status-interactor.module'
import {
  CreatePayoutIntentInteractorModule,
} from '../../../module/payout-intent/interactor/create-payout-intent/create-payout-intent-interactor.module'

@Module({
  imports: [LedgerRepositoryModule, ChangePayoutStatusInteractorModule, CreatePayoutIntentInteractorModule],
  controllers: [PayoutController],
})
export class PayoutControllerModule {}
