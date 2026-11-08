import { Module } from '@nestjs/common'
import { DispatchTransferIntentInteractor } from './dispatch-transfer-intent.interactor'
import { OutboxTxContextModule } from '../../../../shared/tx-context/outbox-tx-context.module'
import { TransferIntentRepositoryModule } from '../../repository/transfer-intent/transfer-intent-repository.module'
import { TransferRouteRepositoryModule } from '../../repository/transfer-route/transfer-route-repository.module'
import { TransferRoutePlannerModule } from '../../service/transfer-route-planner/transfer-route-planner.module'
import { TransferRoutePublisherModule } from '../../../../data/publisher/transfer-route/transfer-route-publisher.module'

@Module({
  imports: [
    OutboxTxContextModule,
    TransferIntentRepositoryModule,
    TransferRoutePlannerModule,
    TransferRouteRepositoryModule,
    TransferRoutePublisherModule,
  ],
  providers: [DispatchTransferIntentInteractor],
  exports: [DispatchTransferIntentInteractor],
})
export class DispatchTransferIntentInteractorModule {}
