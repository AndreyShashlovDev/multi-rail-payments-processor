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
import { PaymentBalanceChangeMetadata } from '@app/shared/types/balance-change'
import {
  ExternalIntegrationRepository,
} from '../../../data/repository/external-integration/external-integration.repository'
import {
  ProcessPaymentTransactionInteractor,
} from '../../../module/payment-intent/interactor/process-payment-transaction/process-payment-transaction.interactor'
import { TransactionModel } from '../../../shared/model/transaction.model'

@Controller()
export class PaymentController {
  constructor(
    ledgerRepository: LedgerRepository,
    private readonly changePaymentStatusInteractor: ChangePaymentStatusInteractor,
    private readonly createPaymentIntentInteractor: CreatePaymentIntentInteractor,
    private readonly processPaymentTransactionInteractor: ProcessPaymentTransactionInteractor,
    private readonly externalIntegrationRepository: ExternalIntegrationRepository,
  ) {
    ledgerRepository.subscribeToChangeBalance({
      handler: async (data) =>
        await this.handlePaymentBalanceChangeEvents(data as BalanceUpdatedResult<PaymentBalanceChangeMetadata>),
      filter: {
        intentType: IntentType.PAYMENT,
        status: new Set([BalanceChangeType.CREDIT, BalanceChangeType.HOLD, BalanceChangeType.HOLD_IN]),
      },
    })

    this.externalIntegrationRepository.subscribeToTransactionEvent({
      handler: async (tx) => await this.handleTransaction(tx),
    })
  }

  private async handleTransaction(transaction: TransactionModel): Promise<void> {
    await this.processPaymentTransactionInteractor.execute({ transaction: transaction })
  }

  private async handlePaymentBalanceChangeEvents(
    data: BalanceUpdatedResult<PaymentBalanceChangeMetadata>,
  ): Promise<void> {
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
