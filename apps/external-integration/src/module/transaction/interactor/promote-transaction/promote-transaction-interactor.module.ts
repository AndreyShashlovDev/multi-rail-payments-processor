import { Module } from '@nestjs/common'
import { PromoteTransactionInteractor } from './promote-transaction.interactor'
import { TransactionIntentRepositoryModule } from '../../../../data/repository/transaction-intent/transaction-intent-repository.module'
import { TransactionEventPublisherModule } from '../../../../data/publisher/transaction-event/transaction-event-publisher.module'
import { TransactionRepositoryModule } from '../../../../data/repository/transaction/transaction-repository.module'
import { TransferIntentRepositoryModule } from '../../../../data/repository/transfer-intent/transfer-intent-repository.module'
import { OutboxTxContextModule } from '../../../../shared/tx-context/outbox-tx-context.module'

@Module({
  imports: [
    OutboxTxContextModule,
    TransactionIntentRepositoryModule,
    TransactionEventPublisherModule,
    TransactionRepositoryModule,
    TransferIntentRepositoryModule,
  ],
  providers: [PromoteTransactionInteractor],
  exports: [PromoteTransactionInteractor],
})
export class PromoteTransactionInteractorModule {}
