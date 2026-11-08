import { Module } from '@nestjs/common'
import { ConfirmTransactionInteractor } from './confirm-transaction.interactor'
import { TransactionEventPublisherModule } from '../../../../data/publisher/transaction-event/transaction-event-publisher.module'
import { TransactionRepositoryModule } from '../../repository/transaction/transaction-repository.module'
import { OutboxTxContextModule } from '../../../../shared/tx-context/outbox-tx-context.module'
import { TransferRoutePublisherModule } from '../../../../data/publisher/transfer-route/transfer-route-publisher.module'
import { TransferRouteResultExtractorStrategyModule } from '../../service/transfer-route-result/transfer-route-result-extractor-strategy.module'

@Module({
  imports: [
    OutboxTxContextModule,
    TransactionRepositoryModule,
    TransactionEventPublisherModule,
    TransferRoutePublisherModule,
    TransferRouteResultExtractorStrategyModule,
  ],
  providers: [ConfirmTransactionInteractor],
  exports: [ConfirmTransactionInteractor],
})
export class ConfirmTransactionInteractorModule {}
