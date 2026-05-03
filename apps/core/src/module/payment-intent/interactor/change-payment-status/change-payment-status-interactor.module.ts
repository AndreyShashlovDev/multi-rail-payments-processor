import { Module } from '@nestjs/common'
import { ChangePaymentStatusInteractor } from './change-payment-status.interactor'
import { TxContextModule } from '../../../../shared/tx-context/tx-context.module'
import { InboxRepositoryModule } from '../../../../data/repository/inbox/inbox-repository.module'
import { ReceiptRepositoryModule } from '../../../../data/repository/receipt/receipt-repository.module'
import { FinalizePaymentOperationModule } from '../operation/finalize-payment/finalize-payment-operation.module'

@Module({
  imports: [TxContextModule, FinalizePaymentOperationModule, ReceiptRepositoryModule, InboxRepositoryModule],
  providers: [ChangePaymentStatusInteractor],
  exports: [ChangePaymentStatusInteractor],
})
export class ChangePaymentStatusInteractorModule {}
