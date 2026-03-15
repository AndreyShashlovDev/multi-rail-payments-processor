import { Module, FactoryProvider } from '@nestjs/common'
import { TxContextRunner, ContextFactory } from '@app/shared'
import { getDataSourceToken } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { IntegrationPostgresConfig } from '../../data/data-source/postgres/integration-postgres.config'

const TxRunnerProvider: FactoryProvider = {
  provide: TxContextRunner,
  inject: [getDataSourceToken(IntegrationPostgresConfig.DATASOURCE_NAME)],
  useFactory: (dataSource: DataSource) => new TxContextRunner(new ContextFactory(dataSource)),
}

@Module({
  imports: [],
  providers: [TxRunnerProvider],
  exports: [TxRunnerProvider],
})
export class TxContextModule {}
