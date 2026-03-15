import { Module } from '@nestjs/common'
import { EscrowController } from './escrow.controller'
import { CreateEscrowInteractorModule } from '../../../module/escrow/interactor/create-escrow-interactor.module'
import { LedgerRepositoryModule } from '../../../data/repository/ledger/ledger-repository.module'

@Module({
  imports: [CreateEscrowInteractorModule, LedgerRepositoryModule],
  controllers: [EscrowController],
})
export class EscrowControllerModule {}
