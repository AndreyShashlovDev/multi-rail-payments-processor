import { Module } from '@nestjs/common'
import { SignTransactionInteractor } from './sign-transaction.interactor'
import { TransactionIntentRepositoryModule } from '../../../../data/repository/transaction-intent/transaction-intent-repository.module'
import { TransferRouteRepositoryModule } from '../../../../data/repository/transfer-route/transfer-route-repository.module'

@Module({
  imports: [TransactionIntentRepositoryModule, TransferRouteRepositoryModule],
  providers: [SignTransactionInteractor],
  exports: [SignTransactionInteractor],
})
export class SignTransactionInteractorModule {}
