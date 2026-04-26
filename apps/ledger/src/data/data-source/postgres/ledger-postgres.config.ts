import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { BaseDatabaseConfig, SnakeNamingStrategy } from '@app/database'
import { join } from 'path'
import Dotenv from 'dotenv'
import { DataSourceOptions } from 'typeorm/data-source/DataSourceOptions'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import { PostgresConfig } from '../../../config/postgres.config'
import { BalanceEventInboxEntity } from './entities/balance-event-inbox.entity'
import { IntegrationAccountEsEntity } from './entities/integration-account-es.entity'
import { IntegrationAccountProjectionEntity } from './entities/integration-account-projection.entity'
import { PlatformAccountEsEntity } from './entities/platform-account-es.entity'
import { PlatformAccountProjectionEntity } from './entities/platform-account-projection.entity'
import { OutboxEntity } from './entities/outbox.entity'

export const APP_SCHEMA = 'ledger'

export class LedgerPostgresConfig extends BaseDatabaseConfig {
  public static readonly DATASOURCE_NAME = 'ledger'

  static getTypeOrmConfig(configService?: PostgresConfig): TypeOrmModuleOptions {
    const dbConfig = configService ? configService : this.getEnvConfig()

    return this.createTypeOrmOptions({
      type: 'postgres',
      name: LedgerPostgresConfig.DATASOURCE_NAME,
      namingStrategy: new SnakeNamingStrategy(),
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      schema: dbConfig.schema,
      ssl: dbConfig.ssl,
      entities: [
        BalanceEventInboxEntity,
        IntegrationAccountEsEntity,
        IntegrationAccountProjectionEntity,
        PlatformAccountEsEntity,
        PlatformAccountProjectionEntity,
        OutboxEntity,
      ],
      migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
      synchronize: false,
      logging: dbConfig.logging,
    })
  }

  static getMigrationConfig(): DataSourceOptions {
    return LedgerPostgresConfig.getTypeOrmConfig() as PostgresConnectionOptions
  }

  private static getEnvConfig(): PostgresConfig {
    Dotenv.config({ path: ['.env', 'apps/ledger/.env', '.env.sample', 'apps/ledger/.env.sample'] })

    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'eventsourcing',
      schema: process.env.DB_SCHEMA || 'ledger',
      ssl: process.env.DB_SSL === 'true',
      logging: process.env.DB_LOGGING === 'true',
    } satisfies PostgresConfig
  }
}

const dataSource = new DataSource(LedgerPostgresConfig.getMigrationConfig())

console.log('✅ DataSource instance created')

export default dataSource
