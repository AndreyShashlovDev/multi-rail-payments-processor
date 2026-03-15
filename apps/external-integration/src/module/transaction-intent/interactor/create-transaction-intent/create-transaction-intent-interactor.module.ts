import { Module } from '@nestjs/common'
import { TxContextModule } from '../../../../shared/tx-context/tx-context.module'
import {
  TransferIntentRepositoryModule,
} from '../../../../data/repository/transfer-intent/transfer-intent-repository.module'
import {
  TransactionIntentRepositoryModule,
} from '../../../../data/repository/transaction-intent/transaction-intent-repository.module'
import { CreateTransactionIntentInteractor } from './create-transaction-intent.interactor'
import {
  EvmSingleTransferBuilderModule,
} from '../../../transaction/integration/blockchain/transaction-builder/evm-single-transfer-builder.module'
import {
  TransactionEventRepositoryModule,
} from '../../../../data/repository/transaction-event/transaction-event-repository.module'
import {
  TransactionSaverStrategyModule,
} from '../../../transaction/service/transaction-saver/transaction-saver-strategy.module'

@Module({
  imports: [
    TxContextModule,
    TransferIntentRepositoryModule,
    TransactionIntentRepositoryModule,
    EvmSingleTransferBuilderModule,
    TransactionSaverStrategyModule,
    TransactionEventRepositoryModule,
  ],
  providers: [CreateTransactionIntentInteractor],
  exports: [CreateTransactionIntentInteractor],
})
export class CreateTransactionIntentInteractorModule {}
