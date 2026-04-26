import { Module } from '@nestjs/common'
import { LedgerEventListener } from './ledger-event.listener'
import { LedgerConsumerModule } from '../../../../data/consumer/ledger/ledger-consumer.module'
import { ChangePayoutStatusInteractorModule } from '../../interactor/change-payout-status/change-payout-status-interactor.module'

@Module({
  imports: [LedgerConsumerModule, ChangePayoutStatusInteractorModule],
  providers: [LedgerEventListener],
})
export class LedgerEventListenerModule {}
