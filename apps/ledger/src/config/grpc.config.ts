import { registerAs } from '@nestjs/config'

export interface GrpcConfig {
  readonly host: string
  readonly port: number
  readonly maxReceiveMessageLength: number
  readonly maxSendMessageLength: number
}

export default registerAs(
  'grpc',
  (): GrpcConfig => ({
    host: process.env.GRPC_HOST || '0.0.0.0',
    port: parseInt(process.env.GRPC_PORT || '50051', 10),
    maxReceiveMessageLength: parseInt(process.env.GRPC_MAX_RECEIVE_MESSAGE_LENGTH || '4194304', 10),
    maxSendMessageLength: parseInt(process.env.GRPC_MAX_SEND_MESSAGE_LENGTH || '4194304', 10),
  }),
)
