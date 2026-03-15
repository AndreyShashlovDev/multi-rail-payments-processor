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
    LedgerPostgresModule,
    BalanceControllerModule,
  ],
  providers: [],
})
export class LedgerModule {}
