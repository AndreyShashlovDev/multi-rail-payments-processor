import { Module, FactoryProvider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { IntegrationJetstreamDataSource } from './integration-jetstream-data-source.service'
import { AppRootConfig } from '../../../../config/app-root-config'
import { SignatureServiceModule } from '../../../../shared/signature/signature-service.module'
import { SignatureService } from '@app/shared'

const Provider: FactoryProvider = {
  provide: IntegrationJetstreamDataSource,
  inject: [ConfigService, SignatureService],
  useFactory: (config: ConfigService<AppRootConfig>, signatureService: SignatureService) =>
    new IntegrationJetstreamDataSource(config.getOrThrow('nats'), signatureService),
}

@Module({
  imports: [SignatureServiceModule],
  providers: [ConfigService, Provider],
  exports: [Provider],
})
export class IntegrationJetstreamDataSourceModule {}
