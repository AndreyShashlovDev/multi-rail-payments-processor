import { Module, FactoryProvider } from '@nestjs/common'
import { IntegrationType } from '@app/shared'
import { TransferRouteResultExtractorStrategy } from './transfer-route-result-extractor.strategy'
import { EvmTransferRouteResultExtractorModule } from '../integration/blockchain/transfer-route-result/evm-transfer-route-result-extractor.module'
import { EvmTransferRouteResultExtractor } from '../integration/blockchain/transfer-route-result/evm-transfer-route-result-extractor'

const Provider: FactoryProvider = {
  provide: TransferRouteResultExtractorStrategy,
  inject: [EvmTransferRouteResultExtractor],
  useFactory: (evmExtractor: EvmTransferRouteResultExtractor) =>
    new TransferRouteResultExtractorStrategy(
      new Map([
        [IntegrationType.ETHEREUM, evmExtractor],
        [IntegrationType.POLYGON, evmExtractor],
      ]),
    ),
}

@Module({
  imports: [EvmTransferRouteResultExtractorModule],
  providers: [Provider],
  exports: [Provider],
})
export class TransferRouteResultExtractorStrategyModule {}
