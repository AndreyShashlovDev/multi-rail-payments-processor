import { Module, FactoryProvider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LogicJetstreamDataSource } from './logic-jetstream.data-source'
import { AppRootConfig } from '../../../../config/app-root-config'

const Provider: FactoryProvider = {
  provide: LogicJetstreamDataSource,
  inject: [ConfigService],
  useFactory: (config: ConfigService<AppRootConfig>) => new LogicJetstreamDataSource(config.getOrThrow('nats')),
}

@Module({
  providers: [ConfigService, Provider],
  exports: [Provider],
})
export class LogicJetstreamDataSourceModule {}
