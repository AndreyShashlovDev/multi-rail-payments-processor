import { Module } from '@nestjs/common'
import { InboxTransferCron } from './inbox-transfer.cron'
import { ProcessPayoutTransactionInteractorModule } from '../../../../module/payout-intent/interactor/process-payout-transaction/process-payout-transaction-interactor.module'
import { ProcessPaymentTransactionInteractorModule } from '../../../../module/payment-intent/interactor/process-payment-transaction/process-payment-transaction-interactor.module'

@Module({
  imports: [ProcessPayoutTransactionInteractorModule, ProcessPaymentTransactionInteractorModule],
  providers: [InboxTransferCron],
})
export class InboxTransferCronModule {}
