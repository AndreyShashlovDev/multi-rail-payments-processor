import { Module } from '@nestjs/common'
import { PromoteTransactionInteractor } from './promote-transaction.interactor'
import {
  TransactionIntentRepositoryModule,
} from '../../../../data/repository/transaction-intent/transaction-intent-repository.module'
import { TxContextModule } from '../../../../shared/tx-context/tx-context.module'
import {
  TransactionEventRepositoryModule,
} from '../../../../data/repository/transaction-event/transaction-event-repository.module'
import { TransactionRepositoryModule } from '../../../../data/repository/transaction/transaction-repository.module'
import {
  TransferIntentRepositoryModule,
} from '../../../../data/repository/transfer-intent/transfer-intent-repository.module'

@Module({
  imports: [
    TxContextModule,
    TransactionIntentRepositoryModule,
    TransactionEventRepositoryModule,
    TransactionRepositoryModule,
    TransferIntentRepositoryModule,
  ],
  providers: [PromoteTransactionInteractor],
  exports: [PromoteTransactionInteractor],
})
export class PromoteTransactionInteractorModule {}
