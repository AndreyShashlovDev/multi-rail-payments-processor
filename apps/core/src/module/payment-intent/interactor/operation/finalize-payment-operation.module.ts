import { Module } from '@nestjs/common'
import { FinalizePaymentOperation } from './finalize-payment.operation'
import { PaymentIntentRepositoryModule } from '../../../../data/repository/payment-intent/payment-intent-repository.module'
import { PaymentAmountAccumulatorRepositoryModule } from '../../../../data/repository/payment-amount-accumulator/payment-amount-accumulator-repository.module'
import { ReceiptRepositoryModule } from '../../../../data/repository/receipt/receipt-repository.module'

@Module({
  imports: [PaymentIntentRepositoryModule, PaymentAmountAccumulatorRepositoryModule, ReceiptRepositoryModule],
  providers: [FinalizePaymentOperation],
  exports: [FinalizePaymentOperation],
})
export class FinalizePaymentOperationModule {}
