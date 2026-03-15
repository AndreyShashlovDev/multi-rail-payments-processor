import { AppConfig } from './app.config'
import { NatsConfig } from './nats.config'
import { PostgresConfig } from './postgres.config'
import { GrpcConfig } from './grpc.config'

export interface AppRootConfig {
  readonly app: AppConfig
  readonly nats: NatsConfig
  readonly postgres: PostgresConfig
  readonly grpc: GrpcConfig
}
