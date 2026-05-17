import appConfig, { AppConfig } from './app.config'
import natsConfig, { NatsConfig } from './nats.config'
import postgresConfig, { PostgresConfig } from './postgres.config'
import grpcConfig, { GrpcConfig } from './grpc.config'
import loggingConfig from './logging.config'

export const AppConfigs = [appConfig, postgresConfig, natsConfig, loggingConfig, grpcConfig]

export interface AppRootConfig {
  readonly app: AppConfig
  readonly nats: NatsConfig
  readonly postgres: PostgresConfig
  readonly grpc: GrpcConfig
}
