import { Module } from '@nestjs/common'
import { ProcessPaymentTransactionInteractor } from './process-payment-transaction.interactor'
import { InboxRepositoryModule } from '../../../../data/repository/inbox/inbox-repository.module'
import { TransactionBalanceProjectorStrategyModule } from '../../transaction-balance-projector/transaction-balance-projector-strategy.module'
import { PaymentInboxTransferRepositoryModule } from '../../../../data/repository/payment-inbox-transfer/payment-inbox-transfer-repository.module'
import { PaymentAmountAccumulatorRepositoryModule } from '../../../../data/repository/payment-amount-accumulator/payment-amount-accumulator-repository.module'
import { PaymentIntentRepositoryModule } from '../../../../data/repository/payment-intent/payment-intent-repository.module'
import { OutboxTxContextModule } from '../../../../shared/tx-context/outbox-tx-context.module'
import { LedgerPublisherModule } from '../../../../data/publisher/ledger/ledger-publisher.module'

@Module({
  imports: [
    OutboxTxContextModule,
    TransactionBalanceProjectorStrategyModule,
    LedgerPublisherModule,
    InboxRepositoryModule,
    PaymentIntentRepositoryModule,
    PaymentInboxTransferRepositoryModule,
    PaymentAmountAccumulatorRepositoryModule,
  ],
  providers: [ProcessPaymentTransactionInteractor],
  exports: [ProcessPaymentTransactionInteractor],
})
export class ProcessPaymentTransactionInteractorModule {}
