import { Module } from '@nestjs/common'
import { InboxRepositoryModule } from '../../../../data/repository/inbox/inbox-repository.module'
import { PayoutIntentRepositoryModule } from '../../../../data/repository/payout-intent/payout-intent-repository.module'
import { ChangePayoutStatusInteractor } from './change-payout-status.interactor'
import { OutboxTxContextModule } from '../../../../shared/tx-context/outbox-tx-context.module'
import { ExternalIntegrationPublisherModule } from '../../../../data/publisher/external-integration/external-integration-publisher.module'

@Module({
  imports: [
    OutboxTxContextModule,
    PayoutIntentRepositoryModule,
    InboxRepositoryModule,
    ExternalIntegrationPublisherModule,
  ],
  providers: [ChangePayoutStatusInteractor],
  exports: [ChangePayoutStatusInteractor],
})
export class ChangePayoutStatusInteractorModule {}
