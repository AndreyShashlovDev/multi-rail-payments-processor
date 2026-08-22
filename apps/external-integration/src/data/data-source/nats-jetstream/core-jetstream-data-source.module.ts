import { Module, FactoryProvider } from '@nestjs/common'
import { CoreJetstreamDataSource } from './core-jetstream.data-source'
import { NatsConfig, NatsConfigModule } from '../../../config'
import { SignatureServiceModule } from '../../../shared/signature/signature-service.module'
import { SignatureService } from '@app/shared'

const Provider: FactoryProvider = {
  provide: CoreJetstreamDataSource,
  inject: [NatsConfig, SignatureService],
  useFactory: (natsConfig: NatsConfig, signatureService: SignatureService) =>
    new CoreJetstreamDataSource(natsConfig, signatureService),
}

@Module({
  imports: [NatsConfigModule, SignatureServiceModule],
  providers: [Provider],
  exports: [Provider],
})
export class CoreJetstreamDataSourceModule {}
