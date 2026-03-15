import { Module } from '@nestjs/common'
import { SignTransactionInteractor } from './sign-transaction.interactor'
import {
  TransactionIntentRepositoryModule,
} from '../../../../data/repository/transaction-intent/transaction-intent-repository.module'

@Module({
  imports: [TransactionIntentRepositoryModule],
  providers: [SignTransactionInteractor],
  exports: [SignTransactionInteractor],
})
export class SignTransactionInteractorModule {}
