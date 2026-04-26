import { Module } from '@nestjs/common'
import { TransactionEventPublisherModule } from '../../../../data/publisher/transaction-event/transaction-event-publisher.module'
import { TransactionParserStrategyModule } from '../../service/transaction-parser/transaction-parser-strategy.module'
import { TransactionSaverStrategyModule } from '../../service/transaction-saver/transaction-saver-strategy.module'
import { IntegrationAccountRepositoryModule } from '../../../../data/repository/integration-account/integration-account-repository.module'
import { WebhookAcceptTransactionInteractor } from './webhook-accept-transaction-interactor'
import { TransferIntentRepositoryModule } from '../../../../data/repository/transfer-intent/transfer-intent-repository.module'
import { TransactionIntentRepositoryModule } from '../../../../data/repository/transaction-intent/transaction-intent-repository.module'
import { OutboxTxContextModule } from '../../../../shared/tx-context/outbox-tx-context.module'

@Module({
  imports: [
    OutboxTxContextModule,
    TransactionEventPublisherModule,
    TransactionParserStrategyModule,
    TransactionSaverStrategyModule,
    IntegrationAccountRepositoryModule,
    TransactionIntentRepositoryModule,
    TransferIntentRepositoryModule,
  ],
  providers: [WebhookAcceptTransactionInteractor],
  exports: [WebhookAcceptTransactionInteractor],
})
export class WebhookAcceptTransactionInteractorModule {}
