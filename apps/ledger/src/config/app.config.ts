import { registerAs } from '@nestjs/config'

export interface AppConfig {
  readonly name: string
  readonly nodeEnv: string
  readonly http: {
    readonly port: number
  }
}

export default registerAs(
  'app',
  (): AppConfig => ({
    name: process.env.SERVICE_NAME || 'ledger',
    nodeEnv: process.env.NODE_ENV || 'development',
    http: {
      port: parseInt(process.env.HTTP_PORT || '3003', 10),
    },
  }),
)