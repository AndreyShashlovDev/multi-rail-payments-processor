import { Module } from '@nestjs/common'
import { EnvironmentModule, AppConfigModule, GrpcConfigModule } from '../config'
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
    EnvironmentModule,
    AppConfigModule,
    GrpcConfigModule,
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
