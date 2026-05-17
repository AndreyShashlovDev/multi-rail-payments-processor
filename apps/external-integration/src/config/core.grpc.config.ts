import { registerAs } from '@nestjs/config'

export interface CoreGrpcConfig {
  readonly url: string
  readonly timeout: number
  readonly retries: number
  readonly useSSL: boolean
}

export default registerAs(
  'coreGrpc',
  (): CoreGrpcConfig => ({
    url: process.env.CORE_GRPC_URL!,
    timeout: Number(process.env.CORE_GRPC_TIMEOUT!),
    retries: Number(process.env.CORE_GRPC_RETRIES!),
    useSSL: JSON.parse(process.env.CORE_GRPC_USE_SSL!) === true,
  }),
)
