import { Module } from '@nestjs/common'
import { BalanceController } from './balance.controller'
import {
  ProcessApplyBalanceInteractorModule,
} from '../../../module/balance/interactor/process-apply-balance/process-apply-balance-interactor.module'
import { BalanceEventRepositoryModule } from '../../../data/repository/balance-event/balance-event-repository.module'
import { BalanceRepositoryModule } from '../../../data/repository/balance/balance-repository.module'

@Module({
  imports: [ProcessApplyBalanceInteractorModule, BalanceEventRepositoryModule, BalanceRepositoryModule],
  controllers: [BalanceController],
})
export class BalanceControllerModule {}
