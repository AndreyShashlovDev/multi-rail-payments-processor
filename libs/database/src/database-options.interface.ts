import { NamingStrategyInterface } from 'typeorm'

export interface DatabaseConnectionOptions {
  readonly name?: string
  readonly namingStrategy?: NamingStrategyInterface
  readonly type: 'postgres' | 'mysql' | 'mongodb'
  readonly host: string
  readonly port: number
  readonly username: string
  readonly password: string
  readonly database: string
  readonly schema?: string
  readonly ssl?: boolean | { rejectUnauthorized: boolean }
  readonly synchronize?: boolean
  readonly logging?: boolean | ('query' | 'error' | 'schema' | 'warn' | 'info' | 'log')[]
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  readonly entities: Function[]
  readonly migrations: string[]
  readonly migrationsRun?: boolean
}

export interface DatabaseModuleOptions {
  readonly connections: ReadonlyArray<DatabaseConnectionOptions>
}
