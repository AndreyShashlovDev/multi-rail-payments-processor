import { FactoryProvider, Module } from '@nestjs/common'
import { EnvironmentModule } from './environment.module'
import { EnvironmentVariables } from './env.validation'
import { AppConfig } from './app.config'

const Provider: FactoryProvider = {
  provide: AppConfig,
  inject: [EnvironmentVariables],
  useFactory: (env: EnvironmentVariables) =>
    new AppConfig(
      env.SERVICE_NAME,
      env.NODE_ENV,
      { port: env.HTTP_PORT },
      { signatureSecrets: env.SECURE_SIGNATURE_SECRETS },
    ),
}

@Module({
  imports: [EnvironmentModule],
  providers: [Provider],
  exports: [Provider],
})
export class AppConfigModule {}
