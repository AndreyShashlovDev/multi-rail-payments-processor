import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import appConfig from '../config/app.config'
import postgresConfig from '../config/postgres.config'
import natsConfig from '../config/nats.config'
import loggingConfig from '../config/logging.config'
import { validate } from '../config'
import grpcConfig from '../config/grpc.config'
import { BalanceControllerModule } from '../api/controller/balance/balance-controller.module'
import { LedgerPostgresModule } from '../data/data-source/postgres/ledger-postgres.module'
import { OutboxPublisherCronModule } from './service/cron/outbox-publisher/outbox-publisher-cron.module'
import { BalanceModule } from '../module/balance/balance.module'
import { ScheduleModule } from '@nestjs/schedule'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { OutboxPublishListenerModule } from './listener/outbox-publisher/outbox-publish-listener.module'

const CRON_MODULES = [OutboxPublisherCronModule]

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, postgresConfig, natsConfig, loggingConfig, grpcConfig],
      validate,
      cache: true,
      expandVariables: true,
      envFilePath: ['.env', '.env.sample'],
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ...CRON_MODULES,
    LedgerPostgresModule,
    BalanceControllerModule,
    BalanceModule,
    OutboxPublishListenerModule,
  ],
  providers: [],
})
export class LedgerModule {}
