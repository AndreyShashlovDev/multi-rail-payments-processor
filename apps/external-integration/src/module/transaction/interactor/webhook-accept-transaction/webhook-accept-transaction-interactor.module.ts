import { Module } from '@nestjs/common'
import {
  TransactionEventRepositoryModule,
} from '../../../../data/repository/transaction-event/transaction-event-repository.module'
import { TransactionParserStrategyModule } from '../../service/transaction-parser/transaction-parser-strategy.module'
import { TransactionSaverStrategyModule } from '../../service/transaction-saver/transaction-saver-strategy.module'
import {
  IntegrationAccountRepositoryModule,
} from '../../../../data/repository/integration-account/integration-account-repository.module'
import { WebhookAcceptTransactionInteractor } from './webhook-accept-transaction-interactor'
import {
  TransferIntentRepositoryModule,
} from '../../../../data/repository/transfer-intent/transfer-intent-repository.module'
import { TxContextModule } from '../../../../shared/tx-context/tx-context.module'
import {
  TransactionIntentRepositoryModule,
} from '../../../../data/repository/transaction-intent/transaction-intent-repository.module'

@Module({
  imports: [
    TxContextModule,
    TransactionEventRepositoryModule,
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
