import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CorePostgresConfig } from './core-postgres.config'
import { PostgresConfig, PostgresConfigModule } from '../../../config'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: CorePostgresConfig.DATASOURCE_NAME,
      imports: [PostgresConfigModule],
      useFactory: (postgresConfig: PostgresConfig) => CorePostgresConfig.getTypeOrmConfig(postgresConfig),
      inject: [PostgresConfig],
    }),
  ],
  exports: [TypeOrmModule],
})
export class CorePostgresModule {}
