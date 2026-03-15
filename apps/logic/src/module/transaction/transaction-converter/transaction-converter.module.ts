import { Module, FactoryProvider, Logger } from '@nestjs/common'
import { TransactionConverterEngine } from './transaction-converter.engine'
import { PaymentConverters, PayoutConfirmedConverters, PayoutPreparedConverters } from './transaction-converter.mapper'
import { PaymentTransactionContext } from './payment-converter/payment-transaction.converter'
import { PayoutTransactionContext } from './payout-converter/payout-transaction.converter'

export abstract class PaymentTransactionConverter extends TransactionConverterEngine<PaymentTransactionContext> {}

export abstract class PayoutPreparedTransactionConverter extends TransactionConverterEngine<PayoutTransactionContext> {}

export abstract class PayoutConfirmedTransactionConverter extends TransactionConverterEngine<PayoutTransactionContext> {}

const PaymentEngineProvider: FactoryProvider = {
  provide: PaymentTransactionConverter,
  useFactory: () => {
    return new TransactionConverterEngine(PaymentConverters, new Logger())
  },
}

const PayoutConfirmedEngineProvider: FactoryProvider = {
  provide: PayoutConfirmedTransactionConverter,
  useFactory: () => {
    return new TransactionConverterEngine(PayoutConfirmedConverters, new Logger())
  },
}

const PayoutPreparedEngineProvider: FactoryProvider = {
  provide: PayoutPreparedTransactionConverter,
  useFactory: () => {
    return new TransactionConverterEngine(PayoutPreparedConverters, new Logger())
  },
}

@Module({
  providers: [PaymentEngineProvider, PayoutConfirmedEngineProvider, PayoutPreparedEngineProvider],
  exports: [PaymentEngineProvider, PayoutConfirmedEngineProvider, PayoutPreparedEngineProvider],
})
export class TransactionConverterModule {}
