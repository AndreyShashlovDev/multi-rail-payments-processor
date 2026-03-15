import { Module } from '@nestjs/common'
import { PaymentController } from './payment.controller'
import { LedgerRepositoryModule } from '../../../data/repository/ledger/ledger-repository.module'
import {
  ChangePaymentStatusInteractorModule,
} from '../../../module/payment-intent/interactor/change-payment-status/change-payment-status-interactor.module'
import {
  CreatePaymentIntentInteractorModule,
} from '../../../module/payment-intent/interactor/create-payment-intent/create-payment-intent-interactor.module'

@Module({
  imports: [LedgerRepositoryModule, ChangePaymentStatusInteractorModule, CreatePaymentIntentInteractorModule],
  controllers: [PaymentController],
})
export class PaymentControllerModule {}
