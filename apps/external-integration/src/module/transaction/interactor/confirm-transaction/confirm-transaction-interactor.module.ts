import { Module } from '@nestjs/common'
import { ConfirmTransactionInteractor } from './confirm-transaction.interactor'
import { TransactionEventPublisherModule } from '../../../../data/publisher/transaction-event/transaction-event-publisher.module'
import { TransactionRepositoryModule } from '../../../../data/repository/transaction/transaction-repository.module'
import { TransferIntentRepositoryModule } from '../../../../data/repository/transfer-intent/transfer-intent-repository.module'
import { OutboxTxContextModule } from '../../../../shared/tx-context/outbox-tx-context.module'

@Module({
  imports: [
    OutboxTxContextModule,
    TransactionRepositoryModule,
    TransactionEventPublisherModule,
    TransferIntentRepositoryModule,
  ],
  providers: [ConfirmTransactionInteractor],
  exports: [ConfirmTransactionInteractor],
})
export class ConfirmTransactionInteractorModule {}
