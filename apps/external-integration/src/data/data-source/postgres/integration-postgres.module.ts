import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IntegrationPostgresConfig } from './integration-postgres.config'
import { PostgresConfig, PostgresConfigModule } from '../../../config'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: IntegrationPostgresConfig.DATASOURCE_NAME,
      imports: [PostgresConfigModule],
      useFactory: (postgresConfig: PostgresConfig) => IntegrationPostgresConfig.getTypeOrmConfig(postgresConfig),
      inject: [PostgresConfig],
    }),
  ],
  exports: [TypeOrmModule],
})
export class IntegrationPostgresModule {}
