import { Module } from '@nestjs/common'
import { ProcessApplyBalanceInteractor } from './process-apply-balance.interactor'
import { BalanceEventInboxRepositoryModule } from '../../../../data/repository/balance-event-inbox/balance-event-inbox-repository.module'
import { BalanceRepositoryModule } from '../../../../data/repository/balance/balance-repository.module'
import { OutboxTxContextModule } from '../../../../shared/tx-context/outbox-tx-context.module'
import { BalanceEventPublisherModule } from '../../../../data/publisher/balance-event/balance-event-publisher.module'
import { BalanceProjectionEventPublisherModule } from '../../../../data/publisher/balance-projection-event/balance-projection-event-publisher.module'

@Module({
  imports: [
    OutboxTxContextModule,
    BalanceEventInboxRepositoryModule,
    BalanceRepositoryModule,
    BalanceEventPublisherModule,
    BalanceProjectionEventPublisherModule,
  ],
  providers: [ProcessApplyBalanceInteractor],
  exports: [ProcessApplyBalanceInteractor],
})
export class ProcessApplyBalanceInteractorModule {}
