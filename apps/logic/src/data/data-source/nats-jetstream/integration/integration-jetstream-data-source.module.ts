import { Module, FactoryProvider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { IntegrationJetstreamDataSource } from './integration-jetstream-data-source.service'
import { AppRootConfig } from '../../../../config/app-root-config'

const Provider: FactoryProvider = {
  provide: IntegrationJetstreamDataSource,
  inject: [ConfigService],
  useFactory: (config: ConfigService<AppRootConfig>) => new IntegrationJetstreamDataSource(config.getOrThrow('nats')),
}

@Module({
  providers: [ConfigService, Provider],
  exports: [Provider],
})
export class IntegrationJetstreamDataSourceModule {}
