import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { BaseDatabaseConfig, SnakeNamingStrategy } from '@app/database'
import { join } from 'path'
import Dotenv from 'dotenv'
import { DataSourceOptions } from 'typeorm/data-source/DataSourceOptions'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import { PostgresConfig } from '../../../config/postgres.config'
import { PayoutIntentEntity } from './entities/payout-intent.entity'
import { AccountEntity } from './entities/account.entity'
import { IntegrationAccountEntity } from './entities/integration-account.entity'
import { IntegrationAccountLinkEntity } from './entities/integration-account-link.entity'
import { IntegrationCurrencyEntity } from './entities/integration-currency.entity'
import { PaymentIntentEntity } from './entities/payment-intent.entity'
import { EscrowEntity } from './entities/escrow.entity'
import { InboxEntity } from './entities/inbox.entity'

export const APP_SCHEMA = 'logic'

export class LogicPostgresConfig extends BaseDatabaseConfig {
  public static readonly DATASOURCE_NAME = 'logic'

  static getTypeOrmConfig(configService?: PostgresConfig): TypeOrmModuleOptions {
    const dbConfig = configService ? configService : this.getEnvConfig()

    return this.createTypeOrmOptions({
      type: 'postgres',
      name: LogicPostgresConfig.DATASOURCE_NAME,
      namingStrategy: new SnakeNamingStrategy(),
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      schema: dbConfig.schema,
      ssl: dbConfig.ssl,
      entities: [
        AccountEntity,
        IntegrationAccountEntity,
        IntegrationAccountLinkEntity,
        IntegrationCurrencyEntity,
        PaymentIntentEntity,
        PayoutIntentEntity,
        EscrowEntity,
        InboxEntity,
      ],
      migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
      synchronize: false,
      logging: dbConfig.logging,
    })
  }

  static getMigrationConfig(): DataSourceOptions {
    return LogicPostgresConfig.getTypeOrmConfig() as PostgresConnectionOptions
  }

  private static getEnvConfig(): PostgresConfig {
    Dotenv.config({ path: ['.env', 'apps/logic/.env', '.env.sample', 'apps/logic/.env.sample'] })

    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'eventsourcing',
      schema: process.env.DB_SCHEMA || 'logic',
      ssl: process.env.DB_SSL === 'true',
      logging: process.env.DB_LOGGING === 'true',
    } satisfies PostgresConfig
  }
}

const dataSource = new DataSource(LogicPostgresConfig.getMigrationConfig())

console.log('✅ DataSource instance created')

export default dataSource
