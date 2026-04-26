import { Controller } from '@nestjs/common'
import { UUID } from '@app/types'
import { ExternalIntegrationConsumer } from '../../../../data/consumer/external-integration/external-integration.consumer'
import { PayoutInboxTransferRepository } from '../../../../data/repository/payout-inbox-transfer/payout-inbox-transfer.repository'
import { ProcessPayoutTransactionInteractor } from '../../interactor/process-payout-transaction/process-payout-transaction.interactor'
import { TransactionModel } from '../../../../shared/model/transaction.model'
import { PayoutInboxTransferData } from '../../model/payout-inbox-transfer.model'
import { IntentType } from '@app/shared'

@Controller()
export class ExternalIntegrationEventListener {
  constructor(
    readonly externalIntegrationConsumer: ExternalIntegrationConsumer,
    private readonly payoutInboxTransferRepository: PayoutInboxTransferRepository,
    private readonly processPayoutTransactionInteractor: ProcessPayoutTransactionInteractor,
  ) {
    this.externalIntegrationConsumer.subscribeToTransactionEvent({
      handler: async (tx) => await this.handleTransaction(tx),
    })
  }

  private async handleTransaction(transaction: TransactionModel): Promise<void> {
    const intentTransfers: PayoutInboxTransferData[] = transaction.transfers
      .filter((item) => item.intent?.intentType === IntentType.PAYOUT)
      .map((transfer) => ({
        txId: transaction.id,
        transferId: transfer.id,
        integration: transaction.integration,
        intentId: transfer.intent!.intentId as UUID,
        txStatus: transaction.status,
        data: {
          ...transaction,
          transfers: [transfer],
        },
      }))

    await this.payoutInboxTransferRepository.insertTransfers(intentTransfers)
    this.processPayoutTransactionInteractor.execute().catch((e) => console.error(e))
  }
}
