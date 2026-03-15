import { Module } from '@nestjs/common'
import { ExternalIntegrationRepositoryModule } from '../../../data/repository/external-integration/external-integration-repository.module'
import { TransactionController } from './transaction.controller'
import { LedgerRepositoryModule } from '../../../data/repository/ledger/ledger-repository.module'
import {
  ProcessIncomingTransactionInteractorModule,
} from '../../../module/transaction/interactor/process-incoming-transaction/process-incoming-transaction-interactor.module'

@Module({
  imports: [ProcessIncomingTransactionInteractorModule, ExternalIntegrationRepositoryModule, LedgerRepositoryModule],
  controllers: [TransactionController],
})
export class TransactionControllerModule {}
