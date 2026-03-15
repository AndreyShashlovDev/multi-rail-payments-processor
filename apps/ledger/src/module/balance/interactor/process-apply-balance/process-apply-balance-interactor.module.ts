import { Module, FactoryProvider, Logger } from '@nestjs/common'
import { ProcessApplyBalanceInteractor } from './process-apply-balance.interactor'
import {
  BalanceEventInboxRepositoryModule,
} from '../../../../data/repository/balance-event-inbox/balance-event-inbox-repository.module'
import { BalanceRepositoryModule } from '../../../../data/repository/balance/balance-repository.module'
import { TxContextRunner, ContextFactory } from '@app/shared'
import { DataSource } from 'typeorm'
import { getDataSourceToken } from '@nestjs/typeorm'
import { LedgerPostgresConfig } from '../../../../data/data-source/postgres/ledger-postgres.config'
import { BalanceEventRepositoryModule } from '../../../../data/repository/balance-event/balance-event-repository.module'

const TxRunnerProvider: FactoryProvider = {
  provide: TxContextRunner,
  inject: [getDataSourceToken(LedgerPostgresConfig.DATASOURCE_NAME)],
  useFactory: (dataSource: DataSource) => new TxContextRunner(new ContextFactory(dataSource)),
}

@Module({
  imports: [BalanceEventInboxRepositoryModule, BalanceRepositoryModule, BalanceEventRepositoryModule],
  providers: [Logger, TxRunnerProvider, ProcessApplyBalanceInteractor],
  exports: [ProcessApplyBalanceInteractor],
})
export class ProcessApplyBalanceInteractorModule {}
