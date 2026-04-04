import { Module, FactoryProvider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CoreJetstreamDataSource } from './core-jetstream-data-source.service'
import { AppRootConfig } from '../../../../config/app-root-config'

const Provider: FactoryProvider = {
  provide: CoreJetstreamDataSource,
  inject: [ConfigService],
  useFactory: (config: ConfigService<AppRootConfig>) => new CoreJetstreamDataSource(config.getOrThrow('nats')),
}

@Module({
  providers: [ConfigService, Provider],
  exports: [Provider],
})
export class CoreJetstreamDataSourceModule {}
