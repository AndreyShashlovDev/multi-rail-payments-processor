import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { validate } from '../config'
import { CorePostgresModule } from '../data/data-source/postgres/core-postgres.module'
import { IntegrationAccountControllerModule } from '../api/controller/integration-account/integration-account-controller.module'
import { PaymentControllerModule } from '../api/controller/payment/payment-controller.module'
import { PayoutControllerModule } from '../api/controller/payout/payout-controller.module'
import { DemoControllerModule } from '../api/controller/demo/demo-controller.module'
import { InboxTransferCronModule } from './service/cron/inbox-transfer/inbox-transfer-cron.module'
import { ScheduleModule } from '@nestjs/schedule'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { OutboxPublishListenerModule } from './listener/outbox-publisher/outbox-publish-listener.module'
import { EscrowModule } from '../module/escrow/escrow.module'
import { PaymentIntentModule } from '../module/payment-intent/payment-intent.module'
import { PayoutIntentModule } from '../module/payout-intent/payout-intent.module'
import { OutboxPublisherCronModule } from './service/cron/outbox-publisher/outbox-publisher-cron.module'
import { FeeModule } from '../module/fee/fee.module'
import { RateModule } from '../module/rate/rate.module'
import { CqrsModule } from '@nestjs/cqrs'
import { IntegrationAccountModule } from '../module/integration-account/integration-account.module'
import { RelayerControllerModule } from '../api/controller/relayer/relayer-controller.module'
import { AppConfigs } from '../config/app-root-config'

const CRON_MODULES = [InboxTransferCronModule, OutboxPublisherCronModule]

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: AppConfigs,
      validate,
      cache: true,
      expandVariables: true,
      envFilePath: ['.env', '.env.sample'],
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    CqrsModule.forRoot(),
    ...CRON_MODULES,
    CorePostgresModule,
    IntegrationAccountControllerModule,
    PaymentControllerModule,
    PayoutControllerModule,
    RelayerControllerModule,
    DemoControllerModule,
    OutboxPublishListenerModule,
    EscrowModule,
    PaymentIntentModule,
    PayoutIntentModule,
    FeeModule,
    RateModule,
    IntegrationAccountModule,
  ],
})
export class AppModule {}
