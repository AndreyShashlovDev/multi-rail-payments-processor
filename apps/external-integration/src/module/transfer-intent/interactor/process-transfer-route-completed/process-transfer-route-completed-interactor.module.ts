import { Module } from '@nestjs/common'
import { ProcessTransferRouteCompletedInteractor } from './process-transfer-route-completed.interactor'
import { OutboxTxContextModule } from '../../../../shared/tx-context/outbox-tx-context.module'
import { InboxRepositoryModule } from '../../../../data/repository/inbox/inbox-repository.module'
import { TransferIntentRepositoryModule } from '../../repository/transfer-intent/transfer-intent-repository.module'
import { TransferRouteRepositoryModule } from '../../repository/transfer-route/transfer-route-repository.module'
import { TransferRoutePlannerModule } from '../../service/transfer-route-planner/transfer-route-planner.module'
import { TransferRoutePublisherModule } from '../../../../data/publisher/transfer-route/transfer-route-publisher.module'

@Module({
  imports: [
    OutboxTxContextModule,
    InboxRepositoryModule,
    TransferIntentRepositoryModule,
    TransferRouteRepositoryModule,
    TransferRoutePlannerModule,
    TransferRoutePublisherModule,
  ],
  providers: [ProcessTransferRouteCompletedInteractor],
  exports: [ProcessTransferRouteCompletedInteractor],
})
export class ProcessTransferRouteCompletedInteractorModule {}
