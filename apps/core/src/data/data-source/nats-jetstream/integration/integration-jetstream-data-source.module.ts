import { Module, FactoryProvider } from '@nestjs/common'
import { IntegrationJetstreamDataSource } from './integration-jetstream-data-source.service'
import { NatsConfig, NatsConfigModule } from '../../../../config'
import { SignatureServiceModule } from '../../../../shared/signature/signature-service.module'
import { SignatureService } from '@app/shared'

const Provider: FactoryProvider = {
  provide: IntegrationJetstreamDataSource,
  inject: [NatsConfig, SignatureService],
  useFactory: (natsConfig: NatsConfig, signatureService: SignatureService) =>
    new IntegrationJetstreamDataSource(natsConfig, signatureService),
}

@Module({
  imports: [NatsConfigModule, SignatureServiceModule],
  providers: [Provider],
  exports: [Provider],
})
export class IntegrationJetstreamDataSourceModule {}
