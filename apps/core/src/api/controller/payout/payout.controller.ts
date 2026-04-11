import { Controller } from '@nestjs/common'
import {
  CreatePayoutIntentInteractor,
} from '../../../module/payout-intent/interactor/create-payout-intent/create-payout-intent.interactor'
import { LedgerRepository } from '../../../data/repository/ledger/ledger.repository'
import { IntentType } from '@app/shared'
import { BalanceUpdatedResult } from '../../../data/repository/ledger/ledger-repository.types'
import {
  ChangePayoutStatusInteractor,
} from '../../../module/payout-intent/interactor/change-payout-status/change-payout-status.interactor'
import { PayoutBalanceChangeMetadata } from '@app/shared/types/balance-change'
import {
  ProcessPayoutTransactionInteractor,
} from '../../../module/payout-intent/interactor/process-payout-transaction/process-payout-transaction.interactor'
import {
  ExternalIntegrationRepository,
} from '../../../data/repository/external-integration/external-integration.repository'
import { TransactionModel } from '../../../shared/model/transaction.model'

@Controller()
export class PayoutController {
  constructor(
    ledgerRepository: LedgerRepository,
    private readonly changePayoutStatusInteractor: ChangePayoutStatusInteractor,
    private readonly createPayoutIntentInteractor: CreatePayoutIntentInteractor,
    private readonly processPayoutTransactionInteractor: ProcessPayoutTransactionInteractor,
    private readonly externalIntegrationRepository: ExternalIntegrationRepository,
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
    await this.processPayoutTransactionInteractor.execute({ transaction: transaction })
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
