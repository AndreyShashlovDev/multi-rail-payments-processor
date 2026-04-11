import { Module, FactoryProvider } from '@nestjs/common'
import { TransactionHandlerStrategy } from '../../../shared/transaction-handler/transaction-handler.strategy'
import { TransactionStatus } from '@app/shared'
import { PreparedHandler } from './handler/prepared.handler'
import { AcceptedHandler } from './handler/accepted.handler'
import { ConfirmedHandler } from './handler/confirmed.handler'
import { RejectedHandler } from './handler/rejected.handler'
import { FailedHandler } from './handler/failed.handler'
import { ReorgHandler } from './handler/reorg.handler'
import { PromotedHandler } from './handler/promoted.handler'
import { PaymentIntentRepository } from '../../../data/repository/payment-intent/payment-intent.repository'
import { PaymentIntentRepositoryModule } from '../../../data/repository/payment-intent/payment-intent-repository.module'
import { TransactionHandler } from '../../../shared/transaction-handler/transaction-handler'

export class PaymentTransactionHandlerStrategy extends TransactionHandlerStrategy {
  constructor(handlers: Map<TransactionStatus, TransactionHandler>) {
    super(handlers)
  }
}

const Provider: FactoryProvider = {
  provide: PaymentTransactionHandlerStrategy,
  inject: [PaymentIntentRepository],
  useFactory: (paymentIntentRepository: PaymentIntentRepository) => {
    return new PaymentTransactionHandlerStrategy(
      new Map<TransactionStatus, TransactionHandler>([
        [TransactionStatus.PREPARED, new PreparedHandler()],
        [TransactionStatus.PROMOTED, new PromotedHandler()],
        [TransactionStatus.ACCEPTED, new AcceptedHandler(paymentIntentRepository)],
        [TransactionStatus.CONFIRMED, new ConfirmedHandler()],
        [TransactionStatus.REJECTED, new RejectedHandler()],
        [TransactionStatus.FAILED, new FailedHandler()],
        [TransactionStatus.REORG, new ReorgHandler()],
      ]),
    )
  },
}

@Module({
  imports: [PaymentIntentRepositoryModule],
  providers: [Provider],
  exports: [Provider],
})
export class TransactionHandlerModule {}
