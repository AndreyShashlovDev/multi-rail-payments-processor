import { Module, FactoryProvider } from '@nestjs/common'
import { TransactionSaverStrategy } from './transaction-saver.strategy'
import { EvmTransactionSaverModule } from '../integration/blockchain/transaction-saver/evm-transaction-saver.module'
import { EvmTransactionSaver } from '../integration/blockchain/transaction-saver/evm-transaction-saver'
import { IntegrationType } from '@app/shared'

const Provider: FactoryProvider = {
  provide: TransactionSaverStrategy,
  inject: [EvmTransactionSaver],
  useFactory: (evmTransactionSaver: EvmTransactionSaver) => {
    return new TransactionSaverStrategy(
      new Map([
        [IntegrationType.ETHEREUM, evmTransactionSaver],
        [IntegrationType.POLYGON, evmTransactionSaver],
      ]),
    )
  },
}

@Module({
  imports: [EvmTransactionSaverModule],
  providers: [Provider],
  exports: [Provider],
})
export class TransactionSaverStrategyModule {}
