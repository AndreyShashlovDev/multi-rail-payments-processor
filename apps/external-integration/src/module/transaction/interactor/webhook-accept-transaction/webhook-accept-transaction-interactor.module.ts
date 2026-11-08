import { Module } from '@nestjs/common'
import { TransactionEventPublisherModule } from '../../../../data/publisher/transaction-event/transaction-event-publisher.module'
import { TransactionParserStrategyModule } from '../../service/transaction-parser/transaction-parser-strategy.module'
import { TransactionSaverStrategyModule } from '../../service/transaction-saver/transaction-saver-strategy.module'
import { WebhookAcceptTransactionInteractor } from './webhook-accept-transaction-interactor'
import { TransactionIntentRepositoryModule } from '../../repository/transaction-intent/transaction-intent-repository.module'
import { OutboxTxContextModule } from '../../../../shared/tx-context/outbox-tx-context.module'

@Module({
  imports: [
    OutboxTxContextModule,
    TransactionEventPublisherModule,
    TransactionParserStrategyModule,
    TransactionSaverStrategyModule,
    TransactionIntentRepositoryModule,
  ],
  providers: [WebhookAcceptTransactionInteractor],
  exports: [WebhookAcceptTransactionInteractor],
})
export class WebhookAcceptTransactionInteractorModule {}
