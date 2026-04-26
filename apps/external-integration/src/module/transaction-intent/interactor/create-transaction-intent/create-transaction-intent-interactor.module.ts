import { Module } from '@nestjs/common'
import { TransferIntentRepositoryModule } from '../../../../data/repository/transfer-intent/transfer-intent-repository.module'
import { TransactionIntentRepositoryModule } from '../../../../data/repository/transaction-intent/transaction-intent-repository.module'
import { CreateTransactionIntentInteractor } from './create-transaction-intent.interactor'
import { EvmSingleTransferBuilderModule } from '../../../transaction/integration/blockchain/transaction-builder/evm-single-transfer-builder.module'
import { TransactionEventPublisherModule } from '../../../../data/publisher/transaction-event/transaction-event-publisher.module'
import { TransactionSaverStrategyModule } from '../../../transaction/service/transaction-saver/transaction-saver-strategy.module'
import { OutboxTxContextModule } from '../../../../shared/tx-context/outbox-tx-context.module'

@Module({
  imports: [
    OutboxTxContextModule,
    TransferIntentRepositoryModule,
    TransactionIntentRepositoryModule,
    EvmSingleTransferBuilderModule,
    TransactionSaverStrategyModule,
    TransactionEventPublisherModule,
  ],
  providers: [CreateTransactionIntentInteractor],
  exports: [CreateTransactionIntentInteractor],
})
export class CreateTransactionIntentInteractorModule {}
