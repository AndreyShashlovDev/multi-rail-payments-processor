import { Module } from '@nestjs/common'
import { EvmSingleTransferBuilder } from './evm-single-transfer.builder'

@Module({
  exports: [EvmSingleTransferBuilder],
  providers: [EvmSingleTransferBuilder],
})
export class EvmSingleTransferBuilderModule {}
