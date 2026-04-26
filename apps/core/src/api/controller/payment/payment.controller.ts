import { Controller, Logger } from '@nestjs/common'
import { CreatePaymentIntentInteractor } from '../../../module/payment-intent/interactor/create-payment-intent/create-payment-intent.interactor'

@Controller()
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name)

  constructor(private readonly createPaymentIntentInteractor: CreatePaymentIntentInteractor) {}

  // @GrpcMethod('BFF', 'CreatePayment')
  // async createPayment(data: CreatePaymentRequest): Promise<CreatePaymentResponse> {
  //   await this.createPaymentIntentInteractor.execute(data)
  // }
  //
  // @GrpcMethod('BFF', 'CancelPayment')
  // async cancelPayment(data: CancelPaymentRequest): Promise<CancelPaymentResponse> {
  // }
  //
  // @GrpcMethod('BFF', 'GetPayment')
  // async getPayment(data: GetPaymentRequest): Promise<GetPaymentResponse> {
  // }
}
