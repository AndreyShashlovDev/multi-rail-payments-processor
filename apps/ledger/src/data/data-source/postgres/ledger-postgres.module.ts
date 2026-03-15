import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { LedgerPostgresConfig } from './ledger-postgres.config'
import { AppRootConfig } from '../../../config/app-root-config'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: LedgerPostgresConfig.DATASOURCE_NAME,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<AppRootConfig>) => {
        return LedgerPostgresConfig.getTypeOrmConfig(configService.getOrThrow('postgres'))
      },
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class LedgerPostgresModule {}
