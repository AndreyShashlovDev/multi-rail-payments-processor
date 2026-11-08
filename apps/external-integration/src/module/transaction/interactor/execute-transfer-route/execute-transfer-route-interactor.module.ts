import { Module } from '@nestjs/common'
import { ExecuteTransferRouteInteractor } from './execute-transfer-route.interactor'
import { OutboxTxContextModule } from '../../../../shared/tx-context/outbox-tx-context.module'
import { InboxRepositoryModule } from '../../../../data/repository/inbox/inbox-repository.module'
import { TransactionEventPublisherModule } from '../../../../data/publisher/transaction-event/transaction-event-publisher.module'
import { TransferRoutePublisherModule } from '../../../../data/publisher/transfer-route/transfer-route-publisher.module'
import { TransactionIntentRepositoryModule } from '../../repository/transaction-intent/transaction-intent-repository.module'
import { TransactionSaverStrategyModule } from '../../service/transaction-saver/transaction-saver-strategy.module'
import { TransferRouteTransactionBuilderModule } from '../../service/integration/transfer-route-transaction-builder.module'

@Module({
  imports: [
    OutboxTxContextModule,
    InboxRepositoryModule,
    TransferRouteTransactionBuilderModule,
    TransactionIntentRepositoryModule,
    TransactionSaverStrategyModule,
    TransactionEventPublisherModule,
    TransferRoutePublisherModule,
  ],
  providers: [ExecuteTransferRouteInteractor],
  exports: [ExecuteTransferRouteInteractor],
})
export class ExecuteTransferRouteInteractorModule {}
