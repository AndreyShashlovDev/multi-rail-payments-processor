import { registerAs } from '@nestjs/config'

export interface AppConfig {
  readonly name: string
  readonly nodeEnv: string
  readonly http: {
    readonly port: number
  }
  readonly secure: {
    readonly signatureSecrets: ReadonlyMap<string, string>
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
    secure: {
      signatureSecrets: new Map(
        Object.entries(JSON.parse(process.env.SECURE_SIGNATURE_SECRETS ?? '') as Record<string, string>),
      ),
    },
  }),
)
