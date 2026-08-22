import { FactoryProvider, Module } from '@nestjs/common'
import { EnvironmentModule } from './environment.module'
import { EnvironmentVariables } from './env.validation'
import { CoreGrpcConfig } from './core.grpc.config'

const Provider: FactoryProvider = {
  provide: CoreGrpcConfig,
  inject: [EnvironmentVariables],
  useFactory: (env: EnvironmentVariables) =>
    new CoreGrpcConfig(env.CORE_GRPC_URL, env.CORE_GRPC_TIMEOUT, env.CORE_GRPC_RETRIES, env.CORE_GRPC_USE_SSL),
}

@Module({
  imports: [EnvironmentModule],
  providers: [Provider],
  exports: [Provider],
})
export class CoreGrpcConfigModule {}
