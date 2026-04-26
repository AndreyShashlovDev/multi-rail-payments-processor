import { Module } from '@nestjs/common'
import { BalanceEventListenerModule } from './listener/balance-event/balance-event-listener.module'

@Module({
  imports: [BalanceEventListenerModule],
})
export class BalanceModule {}
