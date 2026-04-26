import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import appConfig from '../config/app.config'
import natsConfig from '../config/nats.config'
import loggingConfig from '../config/logging.config'
import { validate } from '../config'
import postgresConfig from '../config/postgres.config'
import ledgerGrpcConfig from '../config/ledger.grpc.config'
import grpcConfig from '../config/grpc.config'
import { CorePostgresModule } from '../data/data-source/postgres/core-postgres.module'
import { IntegrationAccountControllerModule } from '../api/controller/integration-account/integration-account-controller.module'
import { PaymentControllerModule } from '../api/controller/payment/payment-controller.module'
import { PayoutControllerModule } from '../api/controller/payout/payout-controller.module'
import { SharedProviderModule } from './shared-provider/shared-provider.module'
import { DemoControllerModule } from '../api/controller/demo/demo-controller.module'
import { InboxTransferCronModule } from './service/cron/inbox-transfer/inbox-transfer-cron.module'
import { ScheduleModule } from '@nestjs/schedule'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { OutboxPublishListenerModule } from './listener/outbox-publisher/outbox-publish-listener.module'
import { EscrowModule } from '../module/escrow/escrow.module'
import { PaymentIntentModule } from '../module/payment-intent/payment-intent.module'
import { PayoutIntentModule } from '../module/payout-intent/payout-intent.module'
import { OutboxPublisherCronModule } from './service/cron/outbox-publisher/outbox-publisher-cron.module'

const CRON_MODULES = [InboxTransferCronModule, OutboxPublisherCronModule]

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, postgresConfig, natsConfig, loggingConfig, ledgerGrpcConfig, grpcConfig],
      validate,
      cache: true,
      expandVariables: true,
      envFilePath: ['.env', '.env.sample'],
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ...CRON_MODULES,
    SharedProviderModule,
    CorePostgresModule,
    IntegrationAccountControllerModule,
    PaymentControllerModule,
    PayoutControllerModule,
    DemoControllerModule,
    OutboxPublishListenerModule,
    EscrowModule,
    PaymentIntentModule,
    PayoutIntentModule,
  ],
})
export class AppModule {}
