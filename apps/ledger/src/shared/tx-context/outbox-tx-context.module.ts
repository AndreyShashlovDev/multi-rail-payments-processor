import { Module, FactoryProvider } from '@nestjs/common'
import { ContextFactory, OutboxTxContextRunner } from '@app/shared'
import { getDataSourceToken } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { OutboxNotifierEmitter } from '../outbox/outbox-notifier-emitter'
import { OutboxNotifierEmitterModule } from '../outbox/outbox-notifier-emitter.module'
import { LedgerPostgresConfig } from '../../data/data-source/postgres/ledger-postgres.config'

const TxRunnerProvider: FactoryProvider = {
  provide: OutboxTxContextRunner,
  inject: [getDataSourceToken(LedgerPostgresConfig.DATASOURCE_NAME), OutboxNotifierEmitter],
  useFactory: (dataSource: DataSource, outboxNotifierEmitter: OutboxNotifierEmitter) =>
    new OutboxTxContextRunner(new ContextFactory(dataSource), outboxNotifierEmitter),
}

@Module({
  imports: [OutboxNotifierEmitterModule],
  providers: [TxRunnerProvider],
  exports: [TxRunnerProvider],
})
export class OutboxTxContextModule {}
