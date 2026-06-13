import { Module } from '@nestjs/common'
import { PaymentController } from './payment.controller'
import { CreatePaymentResolverInteractorModule } from '../../../application/interactor/create-payment-resolver/create-payment-resolver-interactor.module'

@Module({
  imports: [CreatePaymentResolverInteractorModule],
  controllers: [PaymentController],
})
export class PaymentControllerModule {}
