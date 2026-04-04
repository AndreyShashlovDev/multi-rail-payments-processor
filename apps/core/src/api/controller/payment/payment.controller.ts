import { Controller } from '@nestjs/common'
import { LedgerRepository } from '../../../data/repository/ledger/ledger.repository'
import { BalanceChangeType, IntentType } from '@app/shared'
import { BalanceUpdatedResult } from '../../../data/repository/ledger/ledger-repository.types'
import {
  ChangePaymentStatusInteractor,
} from '../../../module/payment-intent/interactor/change-payment-status/change-payment-status.interactor'
import {
  CreatePaymentIntentInteractor,
} from '../../../module/payment-intent/interactor/create-payment-intent/create-payment-intent.interactor'

@Controller()
export class PaymentController {
  constructor(
    ledgerRepository: LedgerRepository,
    private readonly changePaymentStatusInteractor: ChangePaymentStatusInteractor,
    private readonly createPaymentIntentInteractor: CreatePaymentIntentInteractor,
  ) {
    ledgerRepository.subscribeToChangeBalance({
      handler: async (data) => await this.handlePaymentBalanceChangeEvents(data),
      filter: {
        intentType: IntentType.PAYMENT,
        status: new Set([BalanceChangeType.CREDIT, BalanceChangeType.HOLD, BalanceChangeType.HOLD_IN]),
      },
    })
  }

  async handlePaymentBalanceChangeEvents(data: BalanceUpdatedResult): Promise<void> {
    await this.changePaymentStatusInteractor.execute({ data })
  }

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
