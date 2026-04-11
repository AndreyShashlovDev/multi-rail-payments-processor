import { Module } from '@nestjs/common'
import { ProcessPaymentTransactionInteractor } from './process-payment-transaction.interactor'
import { LedgerRepositoryModule } from '../../../../data/repository/ledger/ledger-repository.module'
import { InboxRepositoryModule } from '../../../../data/repository/inbox/inbox-repository.module'
import { TxContextModule } from '../../../../shared/tx-context/tx-context.module'
import {
  TransactionBalanceProjectorStrategyModule,
} from '../../transaction-balance-projector/transaction-balance-projector-strategy.module'
import { TransactionHandlerModule } from '../../transaction-handler/transaction-handler.module'

@Module({
  imports: [
    TxContextModule,
    TransactionBalanceProjectorStrategyModule,
    TransactionHandlerModule,
    LedgerRepositoryModule,
    InboxRepositoryModule,
  ],
  providers: [ProcessPaymentTransactionInteractor],
  exports: [ProcessPaymentTransactionInteractor],
})
export class ProcessPaymentTransactionInteractorModule {}
