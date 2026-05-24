import { Module } from '@nestjs/common'
import { TransactionBuilderStrategy } from './transaction-builder.strategy'
import { EvmSingleTransferBuilderModule } from './blockchain/transaction-builder/evm-single-transfer-builder.module'
import { InternalEvmSingleTransferBuilderModule } from './internal/blockchain/transaction-builder/internal-evm-single-transfer-builder.module'
import { IntegrationAccountRepositoryModule } from '../../../../data/repository/integration-account/integration-account-repository.module'
import { RelayerStrategyModule } from '../relayer/relayer-strategy.module'

@Module({
  imports: [
    EvmSingleTransferBuilderModule,
    InternalEvmSingleTransferBuilderModule,
    IntegrationAccountRepositoryModule,
    RelayerStrategyModule,
  ],
  providers: [TransactionBuilderStrategy],
  exports: [TransactionBuilderStrategy],
})
export class TransactionBuilderStrategyModule {}
