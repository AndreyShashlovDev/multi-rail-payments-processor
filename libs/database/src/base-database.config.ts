import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { DatabaseConnectionOptions } from '@app/database/database-options.interface'

export abstract class BaseDatabaseConfig {
  static createTypeOrmOptions(options: DatabaseConnectionOptions): TypeOrmModuleOptions {
    return {
      type: options.type as unknown as undefined,
      name: options.name || 'default',
      namingStrategy: options.namingStrategy,
      host: options.host,
      port: options.port,
      username: options.username,
      password: options.password,
      database: options.database,
      schema: options.schema,
      ssl: options.ssl ? { rejectUnauthorized: false } : false,
      synchronize: options.synchronize || false,
      logging: options.logging || false,
      entities: options.entities,
      migrations: options.migrations,
      migrationsRun: options.migrationsRun || false,
    }
  }
}
