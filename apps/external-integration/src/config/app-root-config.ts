import appConfig, { AppConfig } from './app.config'
import natsConfig, { NatsConfig } from './nats.config'
import postgresConfig, { PostgresConfig } from './postgres.config'
import coreGrpcConfig, { CoreGrpcConfig } from './core.grpc.config'
import loggingConfig from './logging.config'

export const AppConfigs = [appConfig, coreGrpcConfig, postgresConfig, natsConfig, loggingConfig]

export interface AppRootConfig {
  readonly app: AppConfig
  readonly coreGrpc: CoreGrpcConfig
  readonly nats: NatsConfig
  readonly postgres: PostgresConfig
}
