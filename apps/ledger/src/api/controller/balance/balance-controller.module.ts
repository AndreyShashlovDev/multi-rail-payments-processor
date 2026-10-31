import { Module } from '@nestjs/common'
import { BalanceController } from './balance.controller'
import { BalanceRepositoryModule } from '../../../module/balance/repository/balance/balance-repository.module'

@Module({
  imports: [BalanceRepositoryModule],
  controllers: [BalanceController],
})
export class BalanceControllerModule {}
