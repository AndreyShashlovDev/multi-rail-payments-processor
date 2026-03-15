import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { LogicPostgresConfig } from './logic-postgres.config'
import { AppRootConfig } from '../../../config/app-root-config'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: LogicPostgresConfig.DATASOURCE_NAME,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<AppRootConfig>) => {
        return LogicPostgresConfig.getTypeOrmConfig(configService.getOrThrow('postgres'))
      },
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class LogicPostgresModule {}
