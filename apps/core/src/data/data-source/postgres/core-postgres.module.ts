import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { CorePostgresConfig } from './core-postgres.config'
import { AppRootConfig } from '../../../config/app-root-config'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: CorePostgresConfig.DATASOURCE_NAME,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<AppRootConfig>) => {
        return CorePostgresConfig.getTypeOrmConfig(configService.getOrThrow('postgres'))
      },
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class CorePostgresModule {}
