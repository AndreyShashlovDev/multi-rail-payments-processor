import { Controller } from '@nestjs/common'

@Controller()
export class PayoutController {
  constructor() {}

  // @GrpcMethod('BFF', 'CreatePayout')
  // async createPayout(data: CreatePayoutRequest): Promise<CreatePayoutResponse> {
  //   await this.createPayoutIntentInteractor.execute(data)
  // }
  //
  // @GrpcMethod('BFF', 'CancelPayout')
  // async cancelPayout(data: CancelPayoutRequest): Promise<CancelPayoutResponse> {
  // }
  //
  // @GrpcMethod('BFF', 'GetPayout')
  // async getPayout(data: GetPayoutRequest): Promise<GetPayoutResponse> {
  // }
}
