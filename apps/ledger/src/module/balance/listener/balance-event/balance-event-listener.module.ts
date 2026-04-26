import { Module } from '@nestjs/common'
import { BalanceEventListener } from './balance-event.listener'
import { ProcessApplyBalanceInteractorModule } from '../../interactor/process-apply-balance/process-apply-balance-interactor.module'
import { BalanceEventConsumerModule } from '../../../../data/consumer/balance-event/balance-event-consumer.module'

@Module({
  imports: [ProcessApplyBalanceInteractorModule, BalanceEventConsumerModule],
  providers: [BalanceEventListener],
})
export class BalanceEventListenerModule {}
