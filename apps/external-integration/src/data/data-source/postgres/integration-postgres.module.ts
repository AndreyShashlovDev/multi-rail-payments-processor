import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { IntegrationPostgresConfig } from './integration-postgres.config'
import { AppRootConfig } from '../../../config/app-root-config'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: IntegrationPostgresConfig.DATASOURCE_NAME,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<AppRootConfig>) => {
        return IntegrationPostgresConfig.getTypeOrmConfig(configService.getOrThrow('postgres'))
      },
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class IntegrationPostgresModule {}
