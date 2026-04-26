import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { BaseDatabaseConfig, SnakeNamingStrategy } from '@app/database'
import { TransactionEntity } from './entities/transaction.entity'
import { join } from 'path'
import { PostgresConfig } from '../../../config'
import Dotenv from 'dotenv'
import { DataSourceOptions } from 'typeorm/data-source/DataSourceOptions'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import { TransferEntity } from './entities/transfer.entity'
import { TransferIntentEntity } from './entities/transfer-intent.entity'
import { TransactionRawEntity } from './entities/transaction-raw.entity'
import { TransactionIntentEntity } from './entities/transaction-intent.entity'
import { InboxEntity } from './entities/inbox.entity'
import { OutboxEntity } from './entities/outbox.entity'

export const APP_SCHEMA = 'external_integration'

export class IntegrationPostgresConfig extends BaseDatabaseConfig {
  public static readonly DATASOURCE_NAME = 'integration'

  static getTypeOrmConfig(configService?: PostgresConfig): TypeOrmModuleOptions {
    const dbConfig = configService ? configService : this.getEnvConfig()

    return this.createTypeOrmOptions({
      type: 'postgres',
      name: IntegrationPostgresConfig.DATASOURCE_NAME,
      namingStrategy: new SnakeNamingStrategy(),
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      schema: dbConfig.schema,
      ssl: dbConfig.ssl,
      entities: [
        TransactionEntity,
        TransferIntentEntity,
        TransactionRawEntity,
        TransferEntity,
        TransactionIntentEntity,
        InboxEntity,
        OutboxEntity,
      ],
      migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
      synchronize: false,
      logging: dbConfig.logging,
    })
  }

  static getMigrationConfig(): DataSourceOptions {
    return IntegrationPostgresConfig.getTypeOrmConfig() as PostgresConnectionOptions
  }

  private static getEnvConfig(): PostgresConfig {
    Dotenv.config({
      path: ['.env', 'apps/external-integration/.env', '.env.sample', 'apps/external-integration/.env.sample'],
    })

    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'eventsourcing',
      schema: process.env.DB_SCHEMA || 'external_integration',
      ssl: process.env.DB_SSL === 'true',
      logging: process.env.DB_LOGGING === 'true',
    } satisfies PostgresConfig
  }
}

const dataSource = new DataSource(IntegrationPostgresConfig.getMigrationConfig())

console.log('✅ DataSource instance created')

export default dataSource
