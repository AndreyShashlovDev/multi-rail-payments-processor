import { Module, FactoryProvider } from '@nestjs/common'
import { TransactionHandlerStrategy } from './transaction-handler.strategy'
import { TransactionHandler } from './transaction-handler'
import {
  IntegrationAccountLinkRepositoryModule,
} from '../../../data/repository/integration-account-link/integration-account-link-repository.module'
import { PayoutIntentRepositoryModule } from '../../../data/repository/payout-intent/payout-intent-repository.module'
import { TransactionStatus } from '@app/shared'
import {
  IntegrationAccountLinkRepository,
} from '../../../data/repository/integration-account-link/integration-account-link.repository'
import { PayoutIntentRepository } from '../../../data/repository/payout-intent/payout-intent.repository'
import { PreparedHandler } from './handler/prepared.handler'
import { AcceptedHandler } from './handler/accepted.handler'
import { ConfirmedHandler } from './handler/confirmed.handler'
import { RejectedHandler } from './handler/rejected.handler'
import { FailedHandler } from './handler/failed.handler'
import { ReorgHandler } from './handler/reorg.handler'
import { PromotedHandler } from './handler/promoted.handler'
import { PaymentIntentRepository } from '../../../data/repository/payment-intent/payment-intent.repository'
import { PaymentIntentRepositoryModule } from '../../../data/repository/payment-intent/payment-intent-repository.module'

const Provider: FactoryProvider = {
  provide: TransactionHandlerStrategy,
  inject: [IntegrationAccountLinkRepository, PayoutIntentRepository, PaymentIntentRepository],
  useFactory: (
    integrationAccountLinkRepository: IntegrationAccountLinkRepository,
    payoutIntentRepository: PayoutIntentRepository,
    paymentIntentRepository: PaymentIntentRepository,
  ) => {
    return new TransactionHandlerStrategy(
      new Map<TransactionStatus, TransactionHandler>([
        [TransactionStatus.PREPARED, new PreparedHandler(payoutIntentRepository, integrationAccountLinkRepository)],
        [TransactionStatus.PROMOTED, new PromotedHandler(payoutIntentRepository)],
        [
          TransactionStatus.ACCEPTED,
          new AcceptedHandler(payoutIntentRepository, paymentIntentRepository, integrationAccountLinkRepository),
        ],
        [TransactionStatus.CONFIRMED, new ConfirmedHandler()],
        [TransactionStatus.REJECTED, new RejectedHandler()],
        [TransactionStatus.FAILED, new FailedHandler()],
        [TransactionStatus.REORG, new ReorgHandler()],
      ]),
    )
  },
}

@Module({
  imports: [IntegrationAccountLinkRepositoryModule, PayoutIntentRepositoryModule, PaymentIntentRepositoryModule],
  providers: [Provider],
  exports: [Provider],
})
export class TransactionHandlerModule {}
