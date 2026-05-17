import { Module } from '@nestjs/common'
import { PaymentLedgerEventListener } from './payment-ledger-event.listener'
import { LedgerConsumerModule } from '../../../../data/consumer/ledger/ledger-consumer.module'
import { ChangePaymentStatusInteractorModule } from '../../interactor/change-payment-status/change-payment-status-interactor.module'

@Module({
  imports: [LedgerConsumerModule, ChangePaymentStatusInteractorModule],
  providers: [PaymentLedgerEventListener],
})
export class PaymentLedgerEventListenerModule {}
