import { Module } from '@nestjs/common'
import { TransactionBuilderStrategy } from './transaction-builder.strategy'
import { EvmSingleTransferBuilderModule } from './blockchain/transaction-builder/evm-single-transfer-builder.module'
import { InternalEvmSingleTransferBuilderModule } from './internal/blockchain/transaction-builder/internal-evm-single-transfer-builder.module'

@Module({
  imports: [EvmSingleTransferBuilderModule, InternalEvmSingleTransferBuilderModule],
  providers: [TransactionBuilderStrategy],
  exports: [TransactionBuilderStrategy],
})
export class TransactionBuilderStrategyModule {}
