import { Module } from '@nestjs/common'
import { LedgerEventListener } from './ledger-event.listener'
import { CreateEscrowInteractorModule } from '../../interactor/create-escrow-interactor.module'
import { LedgerConsumerModule } from '../../../../data/consumer/ledger/ledger-consumer.module'

@Module({
  imports: [CreateEscrowInteractorModule, LedgerConsumerModule],
  providers: [LedgerEventListener],
})
export class LedgerEventListenerModule {}
