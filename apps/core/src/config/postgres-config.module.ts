import { FactoryProvider, Module } from '@nestjs/common'
import { EnvironmentModule } from './environment.module'
import { EnvironmentVariables } from './env.validation'
import { PostgresConfig } from './postgres.config'

const Provider: FactoryProvider = {
  provide: PostgresConfig,
  inject: [EnvironmentVariables],
  useFactory: (env: EnvironmentVariables) =>
    new PostgresConfig(
      env.DB_HOST,
      env.DB_PORT,
      env.DB_USERNAME,
      env.DB_PASSWORD,
      env.DB_DATABASE,
      env.DB_SCHEMA,
      env.DB_SSL,
      env.DB_LOGGING,
    ),
}

@Module({
  imports: [EnvironmentModule],
  providers: [Provider],
  exports: [Provider],
})
export class PostgresConfigModule {}
