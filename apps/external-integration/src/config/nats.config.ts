import { registerAs } from '@nestjs/config'

export interface NatsConfig {
  readonly url: string
  readonly clientName: string
}

export default registerAs(
  'nats',
  (): NatsConfig => ({
    url: process.env.NATS_URL || 'nats://localhost:4222',
    clientName: process.env.NATS_CLIENT_NAME || 'integration-service',
  }),
)
