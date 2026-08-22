import { FactoryProvider, Module } from '@nestjs/common'
import { EnvironmentModule } from './environment.module'
import { EnvironmentVariables } from './env.validation'
import { GrpcConfig } from './grpc.config'

const Provider: FactoryProvider = {
  provide: GrpcConfig,
  inject: [EnvironmentVariables],
  useFactory: (env: EnvironmentVariables) =>
    new GrpcConfig(env.GRPC_HOST, env.GRPC_PORT, env.GRPC_MAX_RECEIVE_MESSAGE_LENGTH, env.GRPC_MAX_SEND_MESSAGE_LENGTH),
}

@Module({
  imports: [EnvironmentModule],
  providers: [Provider],
  exports: [Provider],
})
export class GrpcConfigModule {}
