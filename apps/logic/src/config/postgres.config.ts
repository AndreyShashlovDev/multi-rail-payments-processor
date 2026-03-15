import { registerAs } from '@nestjs/config'

export interface PostgresConfig {
  readonly host: string
  readonly port: number
  readonly username: string
  readonly password: string
  readonly database: string
  readonly schema: string
  readonly ssl: boolean
  readonly logging: boolean
}

export default registerAs(
  'postgres',
  (): PostgresConfig => ({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'eventsourcing',
    schema: process.env.DB_SCHEMA || 'logic',
    ssl: process.env.DB_SSL === 'true',
    logging: process.env.DB_LOGGING === 'true',
  }),
)
