import { Module } from '@nestjs/common'
import { ChangePaymentStatusInteractor } from './change-payment-status.interactor'
import { PaymentIntentRepositoryModule } from '../../../../data/repository/payment-intent/payment-intent-repository.module'
import { TxContextModule } from '../../../../shared/tx-context/tx-context.module'
import { InboxRepositoryModule } from '../../../../data/repository/inbox/inbox-repository.module'
import { PaymentReceiptRepositoryModule } from '../../../../data/repository/payment-receipt/payment-receipt-repository.module'

@Module({
  imports: [TxContextModule, PaymentIntentRepositoryModule, PaymentReceiptRepositoryModule, InboxRepositoryModule],
  providers: [ChangePaymentStatusInteractor],
  exports: [ChangePaymentStatusInteractor],
})
export class ChangePaymentStatusInteractorModule {}
