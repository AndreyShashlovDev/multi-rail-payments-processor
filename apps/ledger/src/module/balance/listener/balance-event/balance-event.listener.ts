import { Injectable, Logger } from '@nestjs/common'
import { BalanceEventConsumer } from '../../../../data/consumer/balance-event/balance-event-consumer'
import { ProcessApplyBalanceInteractor } from '../../interactor/process-apply-balance/process-apply-balance.interactor'
import { BalanceChangeRequestEvent } from '@app/shared/services/ledger/v1'
import { BalanceEventListenerMapper } from './balance-event-listener.mapper'

@Injectable()
export class BalanceEventListener {
  private readonly logger: Logger = new Logger(BalanceEventListener.name)

  constructor(
    balanceEventConsumer: BalanceEventConsumer,
    private readonly processApplyBalanceInteractor: ProcessApplyBalanceInteractor,
  ) {
    balanceEventConsumer.subscribeToBalanceChangeEvent({
      handler: async (event) => await this.handleBalanceChange(event),
    })
  }

  private async handleBalanceChange(event: BalanceChangeRequestEvent): Promise<void> {
    await this.processApplyBalanceInteractor.execute({
      uniqueKey: event.uniqueKey,
      changes: BalanceEventListenerMapper.toDomain(event),
    })
  }
}
