import { Module, FactoryProvider } from '@nestjs/common'
import { ContextFactory, OutboxTxContextRunner } from '@app/shared'
import { getDataSourceToken } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { OutboxNotifierEmitter } from '../outbox/outbox-notifier-emitter'
import { OutboxNotifierEmitterModule } from '../outbox/outbox-notifier-emitter.module'
import { CorePostgresConfig } from '../../data/data-source/postgres/core-postgres.config'

const TxRunnerProvider: FactoryProvider = {
  provide: OutboxTxContextRunner,
  inject: [getDataSourceToken(CorePostgresConfig.DATASOURCE_NAME), OutboxNotifierEmitter],
  useFactory: (dataSource: DataSource, outboxNotifierEmitter: OutboxNotifierEmitter) =>
    new OutboxTxContextRunner(new ContextFactory(dataSource), outboxNotifierEmitter),
}

@Module({
  imports: [OutboxNotifierEmitterModule],
  providers: [TxRunnerProvider],
  exports: [TxRunnerProvider],
})
export class OutboxTxContextModule {}
