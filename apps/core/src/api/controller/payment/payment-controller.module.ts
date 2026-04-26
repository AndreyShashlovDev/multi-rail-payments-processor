import { Module } from '@nestjs/common'
import { PaymentController } from './payment.controller'
import { CreatePaymentIntentInteractorModule } from '../../../module/payment-intent/interactor/create-payment-intent/create-payment-intent-interactor.module'

@Module({
  imports: [CreatePaymentIntentInteractorModule],
  controllers: [PaymentController],
})
export class PaymentControllerModule {}
