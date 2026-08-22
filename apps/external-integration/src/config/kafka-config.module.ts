import { FactoryProvider, Module } from '@nestjs/common'
import { EnvironmentModule } from './environment.module'
import { EnvironmentVariables } from './env.validation'
import { AppKafkaConfig } from './kafka.config'

const Provider: FactoryProvider = {
  provide: AppKafkaConfig,
  inject: [EnvironmentVariables],
  useFactory: (env: EnvironmentVariables) => new AppKafkaConfig(env.KAFKA_BROKERS, env.KAFKA_CLIENT_ID),
}

@Module({
  imports: [EnvironmentModule],
  providers: [Provider],
  exports: [Provider],
})
export class KafkaConfigModule {}
