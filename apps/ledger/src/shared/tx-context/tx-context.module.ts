import { Module, FactoryProvider } from '@nestjs/common'
import { TxContextRunner, ContextFactory } from '@app/shared'
import { getDataSourceToken } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { LedgerPostgresConfig } from '../../data/data-source/postgres/ledger-postgres.config'

const TxRunnerProvider: FactoryProvider = {
  provide: TxContextRunner,
  inject: [getDataSourceToken(LedgerPostgresConfig.DATASOURCE_NAME)],
  useFactory: (dataSource: DataSource) => new TxContextRunner(new ContextFactory(dataSource)),
}

@Module({
  imports: [],
  providers: [TxRunnerProvider],
  exports: [TxRunnerProvider],
})
export class TxContextModule {}
