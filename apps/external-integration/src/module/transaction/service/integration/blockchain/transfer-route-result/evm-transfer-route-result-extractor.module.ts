import { Module } from '@nestjs/common'
import { EvmTransferRouteResultExtractor } from './evm-transfer-route-result-extractor'

@Module({
  providers: [EvmTransferRouteResultExtractor],
  exports: [EvmTransferRouteResultExtractor],
})
export class EvmTransferRouteResultExtractorModule {}
