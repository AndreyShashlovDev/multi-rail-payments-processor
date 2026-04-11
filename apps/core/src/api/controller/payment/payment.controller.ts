import { Controller, Logger } from '@nestjs/common'
import { LedgerRepository } from '../../../data/repository/ledger/ledger.repository'
import { BalanceChangeType, IntentType } from '@app/shared'
import { BalanceUpdatedResult } from '../../../data/repository/ledger/ledger-repository.types'
import { ChangePaymentStatusInteractor } from '../../../module/payment-intent/interactor/change-payment-status/change-payment-status.interactor'
import { CreatePaymentIntentInteractor } from '../../../module/payment-intent/interactor/create-payment-intent/create-payment-intent.interactor'
import { PaymentBalanceChangeMetadata } from '@app/shared/types/balance-change'
import { ExternalIntegrationRepository } from '../../../data/repository/external-integration/external-integration.repository'
import { TransactionModel } from '../../../shared/model/transaction.model'
import { PaymentInboxTransferRepository } from '../../../data/repository/payment-inbox-transfer/payment-inbox-transfer.repository'
import { ProcessPaymentTransactionInteractor } from '../../../module/payment-intent/interactor/process-payment-transaction/process-payment-transaction.interactor'
import { PaymentInboxTransferData } from '../../../module/payment-intent/model/payment-inbox-transfer.model'

@Controller()
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name)

  constructor(
    readonly ledgerRepository: LedgerRepository,
    readonly externalIntegrationRepository: ExternalIntegrationRepository,
    private readonly paymentInboxTransferRepository: PaymentInboxTransferRepository,
    private readonly changePaymentStatusInteractor: ChangePaymentStatusInteractor,
    private readonly createPaymentIntentInteractor: CreatePaymentIntentInteractor,
    private readonly processPaymentTransactionInteractor: ProcessPaymentTransactionInteractor,
  ) {
    ledgerRepository.subscribeToChangeBalance({
      handler: async (data) =>
        await this.handlePaymentBalanceChangeEvents(data as BalanceUpdatedResult<PaymentBalanceChangeMetadata>),
      filter: {
        intentType: IntentType.PAYMENT,
        status: new Set([BalanceChangeType.CREDIT, BalanceChangeType.HOLD, BalanceChangeType.HOLD_IN]),
      },
    })

    externalIntegrationRepository.subscribeToTransactionEvent({
      handler: async (tx) => await this.handleTransaction(tx),
    })
  }

  private async handleTransaction(transaction: TransactionModel): Promise<void> {
    const intentTransfers: PaymentInboxTransferData[] = transaction.transfers.map((transfer) => ({
      txId: transaction.id,
      transferId: transfer.id,
      integration: transaction.integration,
      to: transfer.to,
      currency: transfer.currency,
      txStatus: transaction.status,
      data: {
        ...transaction,
        transfers: [transfer],
      },
    }))

    await this.paymentInboxTransferRepository.insertTransfers(intentTransfers)
    this.processPaymentTransactionInteractor.execute().catch((e) => this.logger.error('Payment handleTransaction', e))
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
