import { Logger, Injectable } from '@nestjs/common'
import { ExternalIntegrationConsumer } from '../../../../data/consumer/external-integration/external-integration.consumer'
import { PaymentInboxTransferRepository } from '../../../../data/repository/payment-inbox-transfer/payment-inbox-transfer.repository'
import { ProcessPaymentTransactionInteractor } from '../../interactor/process-payment-transaction/process-payment-transaction.interactor'
import { TransactionModel } from '../../../../shared/model/transaction.model'
import { PaymentInboxTransferData } from '../../model/payment-inbox-transfer.model'

@Injectable()
export class ExternalIntegrationEventListener {
  private readonly logger = new Logger(ExternalIntegrationEventListener.name)

  constructor(
    readonly externalIntegrationConsumer: ExternalIntegrationConsumer,
    private readonly paymentInboxTransferRepository: PaymentInboxTransferRepository,
    private readonly processPaymentTransactionInteractor: ProcessPaymentTransactionInteractor,
  ) {
    externalIntegrationConsumer.subscribeToTransactionEvent({
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
}
