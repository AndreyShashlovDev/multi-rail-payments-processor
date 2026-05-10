import { Module } from '@nestjs/common'
import { InternalEvmSingleTransferBuilder } from './internal-evm-single-transfer.builder'

@Module({
  providers: [InternalEvmSingleTransferBuilder],
  exports: [InternalEvmSingleTransferBuilder],
})
export class InternalEvmSingleTransferBuilderModule {}
