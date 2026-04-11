import { Controller } from '@nestjs/common'
import { LedgerRepository } from '../../../data/repository/ledger/ledger.repository'
import { IntentType } from '@app/shared'
import { BalanceUpdatedResult } from '../../../data/repository/ledger/ledger-repository.types'
import { ChangePayoutStatusInteractor } from '../../../module/payout-intent/interactor/change-payout-status/change-payout-status.interactor'
import { PayoutBalanceChangeMetadata } from '@app/shared/types/balance-change'
import { ExternalIntegrationRepository } from '../../../data/repository/external-integration/external-integration.repository'
import { TransactionModel } from '../../../shared/model/transaction.model'
import { PayoutInboxTransferRepository } from '../../../data/repository/payout-inbox-transfer/payout-inbox-transfer.repository'
import { PayoutInboxTransferData } from '../../../module/payout-intent/model/payout-inbox-transfer.model'
import { ProcessPayoutTransactionInteractor } from '../../../module/payout-intent/interactor/process-payout-transaction/process-payout-transaction.interactor'
import { UUID } from '@app/types'

@Controller()
export class PayoutController {
  constructor(
    readonly ledgerRepository: LedgerRepository,
    readonly externalIntegrationRepository: ExternalIntegrationRepository,
    private readonly payoutInboxTransferRepository: PayoutInboxTransferRepository,
    private readonly changePayoutStatusInteractor: ChangePayoutStatusInteractor,
    private readonly processPayoutTransactionInteractor: ProcessPayoutTransactionInteractor,
  ) {
    ledgerRepository.subscribeToChangeBalance({
      handler: async (data) =>
        await this.handlePayoutBalanceChangeEvents(data as BalanceUpdatedResult<PayoutBalanceChangeMetadata>),
      filter: { intentType: IntentType.PAYOUT },
    })

    this.externalIntegrationRepository.subscribeToTransactionEvent({
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

  private async handlePayoutBalanceChangeEvents(
    data: BalanceUpdatedResult<PayoutBalanceChangeMetadata>,
  ): Promise<void> {
    await this.changePayoutStatusInteractor.execute({ data })
  }

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
