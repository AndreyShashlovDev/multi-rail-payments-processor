import { Module, FactoryProvider } from '@nestjs/common'
import { TxContextRunner, ContextFactory } from '@app/shared'
import { getDataSourceToken } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { CorePostgresConfig } from '../../data/data-source/postgres/core-postgres.config'

const ContextFactoryProvider: FactoryProvider = {
  provide: ContextFactory,
  inject: [getDataSourceToken(CorePostgresConfig.DATASOURCE_NAME)],
  useFactory: (dataSource: DataSource) => new ContextFactory(dataSource),
}

const TxRunnerProvider: FactoryProvider = {
  provide: TxContextRunner,
  inject: [ContextFactory],
  useFactory: (contextFactory: ContextFactory) => new TxContextRunner(contextFactory),
}

@Module({
  imports: [],
  providers: [ContextFactoryProvider, TxRunnerProvider],
  exports: [ContextFactoryProvider, TxRunnerProvider],
})
export class TxContextModule {}
