import { Module } from '@nestjs/common'
import { TransferRoutePlanner } from './transfer-route-planner.service'
import { IntegrationAccountRepositoryModule } from '../../repository/integration-account/integration-account-repository.module'
import { RelayerStrategyModule } from '../relayer/relayer-strategy.module'
import { CorePaymentRepositoryModule } from '../../repository/core-payment/core-payment-repository.module'

@Module({
  imports: [IntegrationAccountRepositoryModule, RelayerStrategyModule, CorePaymentRepositoryModule],
  providers: [TransferRoutePlanner],
  exports: [TransferRoutePlanner],
})
export class TransferRoutePlannerModule {}
