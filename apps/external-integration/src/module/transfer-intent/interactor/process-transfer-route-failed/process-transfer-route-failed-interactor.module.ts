import { Module } from '@nestjs/common'
import { ProcessTransferRouteFailedInteractor } from './process-transfer-route-failed.interactor'
import { TxContextModule } from '../../../../shared/tx-context/tx-context.module'
import { InboxRepositoryModule } from '../../../../data/repository/inbox/inbox-repository.module'
import { TransferIntentRepositoryModule } from '../../repository/transfer-intent/transfer-intent-repository.module'
import { TransferRouteRepositoryModule } from '../../repository/transfer-route/transfer-route-repository.module'

@Module({
  imports: [TxContextModule, InboxRepositoryModule, TransferIntentRepositoryModule, TransferRouteRepositoryModule],
  providers: [ProcessTransferRouteFailedInteractor],
  exports: [ProcessTransferRouteFailedInteractor],
})
export class ProcessTransferRouteFailedInteractorModule {}
