import { Module } from '@nestjs/common'
import { TransactionBalanceProjectorStrategyModule } from '../../transaction-balance-projector/transaction-balance-projector-strategy.module'
import { InboxRepositoryModule } from '../../../../data/repository/inbox/inbox-repository.module'
import { TransactionHandlerModule } from '../../transaction-handler/transaction-handler.module'
import { ProcessPayoutTransactionInteractor } from './process-payout-transaction.interactor'
import { PayoutInboxTransferRepositoryModule } from '../../../../data/repository/payout-inbox-transfer/payout-inbox-transfer-repository.module'
import { OutboxTxContextModule } from '../../../../shared/tx-context/outbox-tx-context.module'
import { LedgerPublisherModule } from '../../../../data/publisher/ledger/ledger-publisher.module'

@Module({
  imports: [
    OutboxTxContextModule,
    TransactionHandlerModule,
    TransactionBalanceProjectorStrategyModule,
    LedgerPublisherModule,
    InboxRepositoryModule,
    PayoutInboxTransferRepositoryModule,
  ],
  providers: [ProcessPayoutTransactionInteractor],
  exports: [ProcessPayoutTransactionInteractor],
})
export class ProcessPayoutTransactionInteractorModule {}
