import { Module } from '@nestjs/common'
import { FinalizePaymentOperation } from './finalize-payment.operation'
import { PaymentIntentRepositoryModule } from '../../../repository/payment-intent/payment-intent-repository.module'
import { PaymentAmountAccumulatorRepositoryModule } from '../../../repository/payment-amount-accumulator/payment-amount-accumulator-repository.module'
import { ReceiptRepositoryModule } from '../../../repository/receipt/receipt-repository.module'

@Module({
  imports: [PaymentIntentRepositoryModule, PaymentAmountAccumulatorRepositoryModule, ReceiptRepositoryModule],
  providers: [FinalizePaymentOperation],
  exports: [FinalizePaymentOperation],
})
export class FinalizePaymentOperationModule {}
