import { Module } from '@nestjs/common'
import { OutboxPublishInteractor } from './outbox-publish.interactor'
import { OutboxRepositoryModule } from '../../../data/repository/outbox/outbox-repository.module'
import { TxContextModule } from '../../../shared/tx-context/tx-context.module'
import { BalanceEventPublisherModule } from '../../../data/publisher/balance-event/balance-event-publisher.module'

@Module({
  imports: [TxContextModule, OutboxRepositoryModule, BalanceEventPublisherModule],
  providers: [OutboxPublishInteractor],
  exports: [OutboxPublishInteractor],
})
export class OutboxPublishInteractorModule {}
