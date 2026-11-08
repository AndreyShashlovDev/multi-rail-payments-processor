import { Module } from '@nestjs/common'
import { ProcessHeldTransactionInteractor } from './process-held-transaction.interactor'
import { TxContextModule } from '../../../../shared/tx-context/tx-context.module'
import { InboxRepositoryModule } from '../../../../data/repository/inbox/inbox-repository.module'
import { TransactionRepositoryModule } from '../../repository/transaction/transaction-repository.module'
import { TransactionIntentRepositoryModule } from '../../repository/transaction-intent/transaction-intent-repository.module'

@Module({
  imports: [TxContextModule, InboxRepositoryModule, TransactionRepositoryModule, TransactionIntentRepositoryModule],
  providers: [ProcessHeldTransactionInteractor],
  exports: [ProcessHeldTransactionInteractor],
})
export class ProcessHeldTransactionInteractorModule {}
