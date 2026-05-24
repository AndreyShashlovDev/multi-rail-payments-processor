import { Module } from '@nestjs/common'
import { ProcessHeldTransferIntentInteractor } from './process-held-transfer-intent.interactor'
import { TransferIntentRepositoryModule } from '../../../../data/repository/transfer-intent/transfer-intent-repository.module'
import { TxContextModule } from '../../../../shared/tx-context/tx-context.module'
import { InboxRepositoryModule } from '../../../../data/repository/inbox/inbox-repository.module'
import { TransferRouteRepository } from '../../../../data/repository/transfer-route/transfer-route.repository'
import { TransferRouteRepositoryModule } from '../../../../data/repository/transfer-route/transfer-route-repository.module'

@Module({
  imports: [
    TxContextModule,
    InboxRepositoryModule,
    TransferIntentRepositoryModule,
    TransferRouteRepository,
    TransferRouteRepositoryModule,
  ],
  providers: [ProcessHeldTransferIntentInteractor],
  exports: [ProcessHeldTransferIntentInteractor],
})
export class ProcessHeldTransferIntentInteractorModule {}
