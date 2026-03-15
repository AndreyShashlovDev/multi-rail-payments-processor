import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import appConfig from '../config/app.config'
import natsConfig from '../config/nats.config'
import loggingConfig from '../config/logging.config'
import { validate } from '../config'
import postgresConfig from '../config/postgres.config'
import { TransactionControllerModule } from '../api/controller/transaction/transaction-controller.module'
import ledgerGrpcConfig from '../config/ledger.grpc.config'
import grpcConfig from '../config/grpc.config'
import { LogicPostgresModule } from '../data/data-source/postgres/logic-postgres.module'
import {
  IntegrationAccountControllerModule,
} from '../api/controller/integration-account/integration-account-controller.module'
import { EscrowControllerModule } from '../api/controller/escrow/escrow-controller.module'
import { PaymentControllerModule } from '../api/controller/payment/payment-controller.module'
import { PayoutControllerModule } from '../api/controller/payout/payout-controller.module'
import { SharedProviderModule } from './shared-provider/shared-provider.module'
import { DemoControllerModule } from '../api/controller/demo/demo-controller.module'

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
    SharedProviderModule,
    LogicPostgresModule,
    TransactionControllerModule,
    EscrowControllerModule,
    IntegrationAccountControllerModule,
    PaymentControllerModule,
    PayoutControllerModule,
    DemoControllerModule,
  ],
})
export class AppModule {}
