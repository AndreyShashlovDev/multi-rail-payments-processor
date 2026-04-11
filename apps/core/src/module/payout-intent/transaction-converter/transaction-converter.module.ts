import { Module, FactoryProvider } from '@nestjs/common'
import { TransactionConverterEngine } from '../../../shared/projection/transaction-converter.engine'
import { PayoutConfirmedConverters, PayoutPreparedConverters } from './transaction-converter.mapper'
import { PayoutTransactionContext } from './payout-converter/payout-transaction.converter'

export abstract class PayoutPreparedTransactionConverter extends TransactionConverterEngine<PayoutTransactionContext> {}

export abstract class PayoutConfirmedTransactionConverter extends TransactionConverterEngine<PayoutTransactionContext> {}

const PayoutConfirmedEngineProvider: FactoryProvider = {
  provide: PayoutConfirmedTransactionConverter,
  useFactory: () => {
    return new TransactionConverterEngine(PayoutConfirmedConverters)
  },
}

const PayoutPreparedEngineProvider: FactoryProvider = {
  provide: PayoutPreparedTransactionConverter,
  useFactory: () => {
    return new TransactionConverterEngine(PayoutPreparedConverters)
  },
}

@Module({
  providers: [PayoutConfirmedEngineProvider, PayoutPreparedEngineProvider],
  exports: [PayoutConfirmedEngineProvider, PayoutPreparedEngineProvider],
})
export class TransactionConverterModule {}
