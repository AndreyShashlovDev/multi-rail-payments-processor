import { Module } from '@nestjs/common'
import { TransferIntentRepositoryModule } from '../../../../data/repository/transfer-intent/transfer-intent-repository.module'
import { TransactionIntentRepositoryModule } from '../../../../data/repository/transaction-intent/transaction-intent-repository.module'
import { CreateTransactionIntentInteractor } from './create-transaction-intent.interactor'
import { TransactionEventPublisherModule } from '../../../../data/publisher/transaction-event/transaction-event-publisher.module'
import { TransactionSaverStrategyModule } from '../../../transaction/service/transaction-saver/transaction-saver-strategy.module'
import { OutboxTxContextModule } from '../../../../shared/tx-context/outbox-tx-context.module'
import { TransactionBuilderStrategyModule } from '../../../transaction/integration/transaction-builder-strategy.module'

@Module({
  imports: [
    OutboxTxContextModule,
    TransferIntentRepositoryModule,
    TransactionIntentRepositoryModule,
    TransactionBuilderStrategyModule,
    TransactionSaverStrategyModule,
    TransactionEventPublisherModule,
  ],
  providers: [CreateTransactionIntentInteractor],
  exports: [CreateTransactionIntentInteractor],
})
export class CreateTransactionIntentInteractorModule {}
