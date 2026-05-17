import { Logger, Injectable } from '@nestjs/common'
import { LedgerConsumer } from '../../../../data/consumer/ledger/ledger.consumer'
import { BalanceProjectionUpdatedResult } from '../../../../data/consumer/ledger/ledger-consumer.types'
import { IntegrationAccountBalanceRepository } from '../../../../data/repository/integration-account-balance/integration-account-balance.repository'

@Injectable()
export class IntegrationAccountLedgerEventListener {
  private readonly logger = new Logger(IntegrationAccountLedgerEventListener.name)

  constructor(
    readonly ledgerConsumer: LedgerConsumer,
    private readonly integrationAccountBalanceRepository: IntegrationAccountBalanceRepository,
  ) {
    ledgerConsumer.subscribeToChangeProjectionBalance({
      handler: async (data) => await this.handlePaymentBalanceChangeEvents(data),
    })
  }

  private async handlePaymentBalanceChangeEvents(data: BalanceProjectionUpdatedResult): Promise<void> {
    await this.integrationAccountBalanceRepository.upsertBalances({
      ...data,
      updatedAt: data.date,
    })
  }
}
