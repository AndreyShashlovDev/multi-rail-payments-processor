import { Module } from '@nestjs/common'
import { ConfirmTransactionInteractor } from './confirm-transaction.interactor'
import {
  TransactionEventRepositoryModule,
} from '../../../../data/repository/transaction-event/transaction-event-repository.module'
import { TransactionRepositoryModule } from '../../../../data/repository/transaction/transaction-repository.module'
import {
  TransferIntentRepositoryModule,
} from '../../../../data/repository/transfer-intent/transfer-intent-repository.module'
import { TxContextModule } from '../../../../shared/tx-context/tx-context.module'

@Module({
  imports: [
    TxContextModule,
    TransactionRepositoryModule,
    TransactionEventRepositoryModule,
    TransferIntentRepositoryModule,
  ],
  providers: [ConfirmTransactionInteractor],
  exports: [ConfirmTransactionInteractor],
})
export class ConfirmTransactionInteractorModule {}
