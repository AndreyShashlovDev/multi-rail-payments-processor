import { FactoryProvider, Module } from '@nestjs/common'
import { EnvironmentModule } from './environment.module'
import { EnvironmentVariables } from './env.validation'
import { LoggingConfig } from './logging.config'

const Provider: FactoryProvider = {
  provide: LoggingConfig,
  inject: [EnvironmentVariables],
  useFactory: (env: EnvironmentVariables) => new LoggingConfig(env.LOG_LEVEL),
}

@Module({
  imports: [EnvironmentModule],
  providers: [Provider],
  exports: [Provider],
})
export class LoggingConfigModule {}
