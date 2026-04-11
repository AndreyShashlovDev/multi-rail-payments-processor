import { Module, FactoryProvider } from '@nestjs/common'
import { TransactionBalanceProjectorStrategy } from '../../../shared/projection/transaction-balance-projector.strategy'
import { TransactionBalanceProjector } from '../../../shared/projection/transaction-balance-projector'
import { AcceptedProjector } from './projectors/accepted.projector'
import { FailedProjector } from './projectors/failed.projector'
import { ConfirmedProjector } from './projectors/confirmed.projector'
import { ReorgProjector } from './projectors/reorg.projector'
import { LedgerRepositoryModule } from '../../../data/repository/ledger/ledger-repository.module'
import { PayoutTransactionDataLoader } from './payout-transaction-data-loader.service'
import {
  TransactionConverterModule,
  PayoutConfirmedTransactionConverter,
  PayoutPreparedTransactionConverter,
} from '../transaction-converter/transaction-converter.module'
import {
  IntegrationAccountLinkRepositoryModule,
} from '../../../data/repository/integration-account-link/integration-account-link-repository.module'
import { PayoutIntentRepositoryModule } from '../../../data/repository/payout-intent/payout-intent-repository.module'
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

const Provider: FactoryProvider = {
  provide: TransactionBalanceProjectorStrategy,
  inject: [
    IntegrationAccountRepository,
    PayoutConfirmedTransactionConverter,
    PayoutPreparedTransactionConverter,
    PayoutTransactionDataLoader,
  ],
  useFactory: (
    integrationAccountRepository: IntegrationAccountRepository,
    payoutConfirmedTransactionConverter: PayoutConfirmedTransactionConverter,
    payoutPreparedTransactionConverter: PayoutPreparedTransactionConverter,
    transactionDataLoader: PayoutTransactionDataLoader,
  ) => {
    return new TransactionBalanceProjectorStrategy(
      new Map<TransactionStatus, TransactionBalanceProjector>([
        [
          TransactionStatus.PREPARED,
          new PreparedProjector(
            integrationAccountRepository,
            payoutPreparedTransactionConverter,
            transactionDataLoader,
          ),
        ],
        [TransactionStatus.PROMOTED, new PromotedProjector()],
        [TransactionStatus.ACCEPTED, new AcceptedProjector()],
        [
          TransactionStatus.CONFIRMED,
          new ConfirmedProjector(
            integrationAccountRepository,
            payoutConfirmedTransactionConverter,
            transactionDataLoader,
          ),
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
    PayoutIntentRepositoryModule,
    TransactionConverterModule,
    AccountRepositoryModule,
  ],
  providers: [Provider, PayoutTransactionDataLoader],
  exports: [Provider],
})
export class TransactionBalanceProjectorStrategyModule {}
