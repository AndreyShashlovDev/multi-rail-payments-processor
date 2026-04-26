import { Module } from '@nestjs/common'
import { TransferIntentCreateInteractor } from './transfer-intent-create.interactor'
import { TransferIntentRepositoryModule } from '../../../../data/repository/transfer-intent/transfer-intent-repository.module'
import { TxContextModule } from '../../../../shared/tx-context/tx-context.module'
import { InboxRepositoryModule } from '../../../../data/repository/inbox/inbox-repository.module'

@Module({
  imports: [TxContextModule, InboxRepositoryModule, TransferIntentRepositoryModule],
  providers: [TransferIntentCreateInteractor],
  exports: [TransferIntentCreateInteractor],
})
export class TransferIntentCreateInteractorModule {}
