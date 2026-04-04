import { Module, FactoryProvider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LedgerJetstreamDataSource } from './ledger-jetstream.data-source'
import { AppRootConfig } from '../../../../config/app-root-config'

const Provider: FactoryProvider = {
  provide: LedgerJetstreamDataSource,
  inject: [ConfigService],
  useFactory: (config: ConfigService<AppRootConfig>) => new LedgerJetstreamDataSource(config.getOrThrow('nats')),
}

@Module({
  providers: [ConfigService, Provider],
  exports: [Provider],
})
export class LedgerJetstreamDataSourceModule {}
