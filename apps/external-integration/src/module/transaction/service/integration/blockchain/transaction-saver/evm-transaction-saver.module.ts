import { Module } from '@nestjs/common'
import { TransactionRepositoryModule } from '../../../../repository/transaction/transaction-repository.module'
import { EvmTransactionSaver } from './evm-transaction-saver'

@Module({
  imports: [TransactionRepositoryModule],
  providers: [EvmTransactionSaver],
  exports: [EvmTransactionSaver],
})
export class EvmTransactionSaverModule {}
