import { FactoryProvider, Module } from '@nestjs/common'
import { EnvironmentModule } from './environment.module'
import { EnvironmentVariables } from './env.validation'
import { NatsConfig } from './nats.config'

const Provider: FactoryProvider = {
  provide: NatsConfig,
  inject: [EnvironmentVariables],
  useFactory: (env: EnvironmentVariables) => new NatsConfig(env.NATS_URL, env.NATS_CLIENT_NAME),
}

@Module({
  imports: [EnvironmentModule],
  providers: [Provider],
  exports: [Provider],
})
export class NatsConfigModule {}
