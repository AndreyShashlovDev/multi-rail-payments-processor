import { Module } from '@nestjs/common'
import { TransactionBalanceProjectorStrategyModule } from '../../transaction-balance-projector/transaction-balance-projector-strategy.module'
import { LedgerRepositoryModule } from '../../../../data/repository/ledger/ledger-repository.module'
import { InboxRepositoryModule } from '../../../../data/repository/inbox/inbox-repository.module'
import { TransactionHandlerModule } from '../../transaction-handler/transaction-handler.module'
import { TxContextModule } from '../../../../shared/tx-context/tx-context.module'
import { ProcessPayoutTransactionInteractor } from './process-payout-transaction.interactor'
import { PayoutInboxTransferRepositoryModule } from '../../../../data/repository/payout-inbox-transfer/payout-inbox-transfer-repository.module'

@Module({
  imports: [
    TxContextModule,
    TransactionBalanceProjectorStrategyModule,
    TransactionHandlerModule,
    LedgerRepositoryModule,
    InboxRepositoryModule,
    PayoutInboxTransferRepositoryModule,
  ],
  providers: [ProcessPayoutTransactionInteractor],
  exports: [ProcessPayoutTransactionInteractor],
})
export class ProcessPayoutTransactionInteractorModule {}
