import { Module } from '@nestjs/common'
import { TxContextModule } from '../../../../shared/tx-context/tx-context.module'
import { InboxRepositoryModule } from '../../../../data/repository/inbox/inbox-repository.module'
import { PayoutIntentRepositoryModule } from '../../../../data/repository/payout-intent/payout-intent-repository.module'
import { ChangePayoutStatusInteractor } from './change-payout-status.interactor'
import {
  ExternalIntegrationRepositoryModule,
} from '../../../../data/repository/external-integration/external-integration-repository.module'

@Module({
  imports: [TxContextModule, PayoutIntentRepositoryModule, InboxRepositoryModule, ExternalIntegrationRepositoryModule],
  providers: [ChangePayoutStatusInteractor],
  exports: [ChangePayoutStatusInteractor],
})
export class ChangePayoutStatusInteractorModule {}
