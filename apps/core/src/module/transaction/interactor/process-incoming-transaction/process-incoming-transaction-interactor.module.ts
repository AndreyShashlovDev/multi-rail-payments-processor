import { Module } from '@nestjs/common'
import {
  TransactionBalanceProjectorStrategyModule,
} from '../../transaction-balance-projector/transaction-balance-projector-strategy.module'
import { ProcessIncomingTransactionInteractor } from './process-incoming-transaction.interactor'
import { LedgerRepositoryModule } from '../../../../data/repository/ledger/ledger-repository.module'
import { InboxRepositoryModule } from '../../../../data/repository/inbox/inbox-repository.module'
import { TransactionHandlerModule } from '../../transaction-handler/transaction-handler.module'
import { TxContextModule } from '../../../../shared/tx-context/tx-context.module'

@Module({
  imports: [
    TxContextModule,
    TransactionBalanceProjectorStrategyModule,
    TransactionHandlerModule,
    LedgerRepositoryModule,
    InboxRepositoryModule,
  ],
  providers: [ProcessIncomingTransactionInteractor],
  exports: [ProcessIncomingTransactionInteractor],
})
export class ProcessIncomingTransactionInteractorModule {}
