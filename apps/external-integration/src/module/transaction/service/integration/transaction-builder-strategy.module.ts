import { Module } from '@nestjs/common'
import { TransferRouteExecutionPlanner } from './transfer-route-execution-planner.service'
import { EvmSingleTransferBuilderModule } from './blockchain/transaction-builder/evm-single-transfer-builder.module'
import { InternalEvmSingleTransferBuilderModule } from './internal/blockchain/transaction-builder/internal-evm-single-transfer-builder.module'
import { IntegrationAccountRepositoryModule } from '../../../../data/repository/integration-account/integration-account-repository.module'
import { RelayerStrategyModule } from '../relayer/relayer-strategy.module'
import { CorePaymentRepositoryModule } from '../../../../data/repository/core-payment/core-payment-repository.module'

@Module({
  imports: [
    EvmSingleTransferBuilderModule,
    InternalEvmSingleTransferBuilderModule,
    IntegrationAccountRepositoryModule,
    RelayerStrategyModule,
    CorePaymentRepositoryModule,
  ],
  providers: [TransferRouteExecutionPlanner],
  exports: [TransferRouteExecutionPlanner],
})
export class TransactionBuilderStrategyModule {}
