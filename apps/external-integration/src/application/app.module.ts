import { Module } from '@nestjs/common'
import { EnvironmentModule, AppConfigModule } from '../config'
import { WebhookControllerModule } from '../api/controller/webhook/webhook-controller.module'
import { IntegrationPostgresModule } from '../data/data-source/postgres/integration-postgres.module'
import { ScheduleModule } from '@nestjs/schedule'
import { TransferIntentDispatchCronModule } from '../module/transfer-intent/service/cron/transfer-intent-dispatch/transfer-intent-dispatch-cron.module'
import { TransactionModule } from '../module/transaction/transaction.module'
import { FinalizePayoutFlowCronModule } from './service/cron/finalize-payout-flow/finalize-payout-flow-cron.module'
import { OutboxPublishListenerModule } from './listener/outbox-publisher/outbox-publish-listener.module'
import { OutboxPublisherCronModule } from './service/cron/outbox-publisher/outbox-publisher-cron.module'
import { TransferIntentModule } from '../module/transfer-intent/transfer-intent.module'
import { EventEmitterModule } from '@nestjs/event-emitter'

const CRON_MODULES = [TransferIntentDispatchCronModule, FinalizePayoutFlowCronModule, OutboxPublisherCronModule]

@Module({
  imports: [
    EnvironmentModule,
    AppConfigModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ...CRON_MODULES,
    IntegrationPostgresModule,
    WebhookControllerModule,
    TransferIntentModule,
    TransactionModule,
    OutboxPublishListenerModule,
  ],
})
export class AppModule {}
