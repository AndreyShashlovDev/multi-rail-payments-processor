import { Module, FactoryProvider, Injectable } from '@nestjs/common'
import { TransactionHandler } from '../../../shared/transaction-handler/transaction-handler'
import { IntegrationAccountLinkRepositoryModule } from '../../../data/repository/integration-account-link/integration-account-link-repository.module'
import { PayoutIntentRepositoryModule } from '../../../data/repository/payout-intent/payout-intent-repository.module'
import { TransactionStatus } from '@app/shared'
import { IntegrationAccountLinkRepository } from '../../../data/repository/integration-account-link/integration-account-link.repository'
import { PayoutIntentRepository } from '../../../data/repository/payout-intent/payout-intent.repository'
import { PreparedHandler } from './handler/prepared.handler'
import { AcceptedHandler } from './handler/accepted.handler'
import { ConfirmedHandler } from './handler/confirmed.handler'
import { RejectedHandler } from './handler/rejected.handler'
import { FailedHandler } from './handler/failed.handler'
import { ReorgHandler } from './handler/reorg.handler'
import { PromotedHandler } from './handler/promoted.handler'
import { TransactionHandlerStrategy } from '../../../shared/transaction-handler/transaction-handler.strategy'

@Injectable()
export class PayoutTransactionHandlerStrategy extends TransactionHandlerStrategy {
  constructor(handlers: Map<TransactionStatus, TransactionHandler>) {
    super(handlers)
  }
}

const Provider: FactoryProvider = {
  provide: PayoutTransactionHandlerStrategy,
  inject: [IntegrationAccountLinkRepository, PayoutIntentRepository],
  useFactory: (
    integrationAccountLinkRepository: IntegrationAccountLinkRepository,
    payoutIntentRepository: PayoutIntentRepository,
  ) => {
    return new PayoutTransactionHandlerStrategy(
      new Map<TransactionStatus, TransactionHandler>([
        [TransactionStatus.PREPARED, new PreparedHandler(payoutIntentRepository, integrationAccountLinkRepository)],
        [TransactionStatus.PROMOTED, new PromotedHandler(payoutIntentRepository)],
        [TransactionStatus.ACCEPTED, new AcceptedHandler(payoutIntentRepository, integrationAccountLinkRepository)],
        [TransactionStatus.CONFIRMED, new ConfirmedHandler()],
        [TransactionStatus.REJECTED, new RejectedHandler()],
        [TransactionStatus.FAILED, new FailedHandler()],
        [TransactionStatus.REORG, new ReorgHandler()],
      ]),
    )
  },
}

@Module({
  imports: [IntegrationAccountLinkRepositoryModule, PayoutIntentRepositoryModule],
  providers: [Provider],
  exports: [Provider],
})
export class TransactionHandlerModule {}
