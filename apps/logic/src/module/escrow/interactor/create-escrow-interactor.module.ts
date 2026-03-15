import { Module } from '@nestjs/common'
import { CreateEscrowInteractor } from './create-escrow-interactor'
import { EscrowRepositoryModule } from '../../../data/repository/escrow/escrow-repository.module'
import { TxContextModule } from '../../../shared/tx-context/tx-context.module'
import { InboxRepositoryModule } from '../../../data/repository/inbox/inbox-repository.module'

@Module({
  imports: [TxContextModule, EscrowRepositoryModule, InboxRepositoryModule],
  providers: [CreateEscrowInteractor],
  exports: [CreateEscrowInteractor],
})
export class CreateEscrowInteractorModule {}
