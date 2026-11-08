import { Module } from '@nestjs/common'
import { TransferRouteTransactionBuilder } from './transfer-route-transaction-builder.service'
import { EvmSingleTransferBuilderModule } from './blockchain/transaction-builder/evm-single-transfer-builder.module'
import { InternalEvmSingleTransferBuilderModule } from './internal/blockchain/transaction-builder/internal-evm-single-transfer-builder.module'

@Module({
  imports: [EvmSingleTransferBuilderModule, InternalEvmSingleTransferBuilderModule],
  providers: [TransferRouteTransactionBuilder],
  exports: [TransferRouteTransactionBuilder],
})
export class TransferRouteTransactionBuilderModule {}
