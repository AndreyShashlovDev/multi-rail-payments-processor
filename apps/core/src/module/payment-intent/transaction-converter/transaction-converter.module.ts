import { Module, FactoryProvider } from '@nestjs/common'
import { PaymentConverters } from './transaction-converter.mapper'
import { PaymentTransactionContext } from './converter/payment-transaction.converter'
import { TransactionConverterEngine } from '../../../shared/projection/transaction-converter.engine'

export abstract class PaymentTransactionConverter extends TransactionConverterEngine<PaymentTransactionContext> {}

const PaymentEngineProvider: FactoryProvider = {
  provide: PaymentTransactionConverter,
  useFactory: () => new TransactionConverterEngine(PaymentConverters),
}

@Module({
  providers: [PaymentEngineProvider],
  exports: [PaymentEngineProvider],
})
export class TransactionConverterModule {}
