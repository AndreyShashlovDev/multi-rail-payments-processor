import { Module } from '@nestjs/common'
import { OutboxPublishInteractor } from './outbox-publish.interactor'
import { TxContextModule } from '../../../shared/tx-context/tx-context.module'
import { OutboxRepositoryModule } from '../../../data/repository/outbox/outbox-repository.module'
import { TransactionEventPublisherModule } from '../../../data/publisher/transaction-event/transaction-event-publisher.module'
import { TransferRoutePublisherModule } from '../../../data/publisher/transfer-route/transfer-route-publisher.module'

@Module({
  imports: [TxContextModule, OutboxRepositoryModule, TransactionEventPublisherModule, TransferRoutePublisherModule],
  providers: [OutboxPublishInteractor],
  exports: [OutboxPublishInteractor],
})
export class OutboxPublishInteractorModule {}
