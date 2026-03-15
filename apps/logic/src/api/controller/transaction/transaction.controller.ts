import { ExternalIntegrationRepository } from '../../../data/repository/external-integration/external-integration.repository'
import { Controller } from '@nestjs/common'
import {
  ProcessIncomingTransactionInteractor,
} from '../../../module/transaction/interactor/process-incoming-transaction/process-incoming-transaction.interactor'
import { TransactionModel } from '../../../module/transaction/model/transaction.model'

@Controller()
export class TransactionController {
  constructor(
    private readonly externalIntegrationRepository: ExternalIntegrationRepository,
    private readonly processIncomingTransactionInteractor: ProcessIncomingTransactionInteractor,
  ) {
    this.externalIntegrationRepository.subscribeToTransactionEvent({
      handler: async (tx) => await this.handleIncomingTransaction(tx),
    })
  }

  async handleIncomingTransaction(transaction: TransactionModel): Promise<void> {
    await this.processIncomingTransactionInteractor.execute({ transaction })
  }
}
