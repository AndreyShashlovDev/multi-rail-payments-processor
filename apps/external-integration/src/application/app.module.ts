import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import appConfig from '../config/app.config'
import postgresConfig from '../config/postgres.config'
import natsConfig from '../config/nats.config'
import loggingConfig from '../config/logging.config'
import { validate } from '../config'
import { WebhookControllerModule } from '../api/controller/webhook/webhook-controller.module'
import { IntegrationPostgresModule } from '../data/data-source/postgres/integration-postgres.module'
import { TransferIntentControllerModule } from '../api/controller/transfer-intent/transfer-intent-controller.module'
import { ScheduleModule } from '@nestjs/schedule'
import {
  TransactionIntentCronModule,
} from '../module/transaction-intent/service/cron/transaction-intent/transaction-intent-cron.module'
import {
  FinalizePayoutFlowCronModule,
} from './service/cron/finalize-payout-flow/finalize-payout-flow-cron.module'

const CRON_MODULES = [TransactionIntentCronModule, FinalizePayoutFlowCronModule]

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.sample'],
      load: [appConfig, postgresConfig, natsConfig, loggingConfig],
      validate,
      cache: true,
      expandVariables: true,
    }),
    IntegrationPostgresModule,
    WebhookControllerModule,
    TransferIntentControllerModule,
    ScheduleModule.forRoot(),
    ...CRON_MODULES,
  ],
})
export class AppModule {}
