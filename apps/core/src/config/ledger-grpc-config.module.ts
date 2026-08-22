import { FactoryProvider, Module } from '@nestjs/common'
import { EnvironmentModule } from './environment.module'
import { EnvironmentVariables } from './env.validation'
import { LedgerGrpcConfig } from './ledger.grpc.config'

const Provider: FactoryProvider = {
  provide: LedgerGrpcConfig,
  inject: [EnvironmentVariables],
  useFactory: (env: EnvironmentVariables) =>
    new LedgerGrpcConfig(
      env.LEDGER_GRPC_URL,
      env.LEDGER_GRPC_TIMEOUT,
      env.LEDGER_GRPC_RETRIES,
      env.LEDGER_GRPC_USE_SSL,
    ),
}

@Module({
  imports: [EnvironmentModule],
  providers: [Provider],
  exports: [Provider],
})
export class LedgerGrpcConfigModule {}
