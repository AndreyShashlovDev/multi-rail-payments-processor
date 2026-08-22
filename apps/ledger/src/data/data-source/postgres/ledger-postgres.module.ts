import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LedgerPostgresConfig } from './ledger-postgres.config'
import { PostgresConfig, PostgresConfigModule } from '../../../config'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: LedgerPostgresConfig.DATASOURCE_NAME,
      imports: [PostgresConfigModule],
      useFactory: (postgresConfig: PostgresConfig) => LedgerPostgresConfig.getTypeOrmConfig(postgresConfig),
      inject: [PostgresConfig],
    }),
  ],
  exports: [TypeOrmModule],
})
export class LedgerPostgresModule {}
