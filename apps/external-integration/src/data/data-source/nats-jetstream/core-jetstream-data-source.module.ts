import { Module, FactoryProvider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CoreJetstreamDataSource } from './core-jetstream.data-source'
import { AppRootConfig } from '../../../config/app-root-config'
import { SignatureServiceModule } from '../../../shared/signature/signature-service.module'
import { SignatureService } from '@app/shared'

const Provider: FactoryProvider = {
  provide: CoreJetstreamDataSource,
  inject: [ConfigService, SignatureService],
  useFactory: (config: ConfigService<AppRootConfig>, signatureService: SignatureService) =>
    new CoreJetstreamDataSource(config.getOrThrow('nats'), signatureService),
}

@Module({
  imports: [SignatureServiceModule],
  providers: [ConfigService, Provider],
  exports: [Provider],
})
export class CoreJetstreamDataSourceModule {}
