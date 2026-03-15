import { Module, Logger } from '@nestjs/common'
import { TransactionIntentCron } from './transaction-intent.cron'
import { CreateTransactionIntentInteractorModule } from '../../../interactor/create-transaction-intent/create-transaction-intent-interactor.module'

@Module({
  imports: [CreateTransactionIntentInteractorModule],
  providers: [Logger, TransactionIntentCron],
})
export class TransactionIntentCronModule {}
