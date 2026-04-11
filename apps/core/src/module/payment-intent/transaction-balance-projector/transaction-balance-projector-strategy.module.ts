import { Module, FactoryProvider } from '@nestjs/common'
import { AcceptedProjector } from './projectors/accepted.projector'
import { FailedProjector } from './projectors/failed.projector'
import { ConfirmedProjector } from './projectors/confirmed.projector'
import { ReorgProjector } from './projectors/reorg.projector'
import { LedgerRepositoryModule } from '../../../data/repository/ledger/ledger-repository.module'
import { PaymentTransactionDataLoader } from './payment-transaction-data-loader.service'
import {
  TransactionConverterModule,
  PaymentTransactionConverter,
} from '../transaction-converter/transaction-converter.module'
import {
  IntegrationAccountLinkRepositoryModule,
} from '../../../data/repository/integration-account-link/integration-account-link-repository.module'
import {
  PaymentIntentRepositoryModule,
} from '../../../data/repository/payment-intent/payment-intent-repository.module'
import {
  IntegrationAccountRepositoryModule,
} from '../../../data/repository/integration-account/integration-account-repository.module'
import {
  IntegrationAccountRepository,
} from '../../../data/repository/integration-account/integration-account.repository'
import { TransactionStatus } from '@app/shared'
import { PreparedProjector } from './projectors/prepared.projector'
import { RejectedProjector } from './projectors/rejected.projector'
import { PromotedProjector } from './projectors/promoted.projector'
import { AccountRepositoryModule } from '../../../data/repository/account/account-repository.module'
import { TransactionBalanceProjectorStrategy } from '../../../shared/projection/transaction-balance-projector.strategy'
import { TransactionBalanceProjector } from '../../../shared/projection/transaction-balance-projector'

const Provider: FactoryProvider = {
  provide: TransactionBalanceProjectorStrategy,
  inject: [IntegrationAccountRepository, PaymentTransactionConverter, PaymentTransactionDataLoader],
  useFactory: (
    integrationAccountRepository: IntegrationAccountRepository,
    paymentTransactionConverter: PaymentTransactionConverter,
    transactionDataLoader: PaymentTransactionDataLoader,
  ) => {
    return new TransactionBalanceProjectorStrategy(
      new Map<TransactionStatus, TransactionBalanceProjector>([
        [TransactionStatus.PREPARED, new PreparedProjector()],
        [TransactionStatus.PROMOTED, new PromotedProjector()],
        [
          TransactionStatus.ACCEPTED,
          new AcceptedProjector(integrationAccountRepository, paymentTransactionConverter, transactionDataLoader),
        ],
        [
          TransactionStatus.CONFIRMED,
          new ConfirmedProjector(integrationAccountRepository, paymentTransactionConverter, transactionDataLoader),
        ],
        [TransactionStatus.REJECTED, new RejectedProjector()],
        [TransactionStatus.FAILED, new FailedProjector()],
        [TransactionStatus.REORG, new ReorgProjector()],
      ]),
    )
  },
}

@Module({
  imports: [
    LedgerRepositoryModule,
    IntegrationAccountLinkRepositoryModule,
    IntegrationAccountRepositoryModule,
    PaymentIntentRepositoryModule,
    TransactionConverterModule,
    AccountRepositoryModule,
  ],
  providers: [Provider, PaymentTransactionDataLoader],
  exports: [Provider],
})
export class TransactionBalanceProjectorStrategyModule {}
