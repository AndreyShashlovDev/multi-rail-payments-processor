import { Module } from '@nestjs/common'
import { ProcessPaymentTransactionInteractor } from './process-payment-transaction.interactor'
import { LedgerRepositoryModule } from '../../../../data/repository/ledger/ledger-repository.module'
import { InboxRepositoryModule } from '../../../../data/repository/inbox/inbox-repository.module'
import { TxContextModule } from '../../../../shared/tx-context/tx-context.module'
import { TransactionBalanceProjectorStrategyModule } from '../../transaction-balance-projector/transaction-balance-projector-strategy.module'
import { TransactionHandlerModule } from '../../transaction-handler/transaction-handler.module'
import { PaymentInboxTransferRepositoryModule } from '../../../../data/repository/payment-inbox-transfer/payment-inbox-transfer-repository.module'

@Module({
  imports: [
    TxContextModule,
    TransactionBalanceProjectorStrategyModule,
    TransactionHandlerModule,
    LedgerRepositoryModule,
    InboxRepositoryModule,
    PaymentInboxTransferRepositoryModule,
  ],
  providers: [ProcessPaymentTransactionInteractor],
  exports: [ProcessPaymentTransactionInteractor],
})
export class ProcessPaymentTransactionInteractorModule {}
