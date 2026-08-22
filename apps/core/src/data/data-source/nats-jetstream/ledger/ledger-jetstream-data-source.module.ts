import { Module, FactoryProvider } from '@nestjs/common'
import { LedgerJetstreamDataSource } from './ledger-jetstream.data-source'
import { NatsConfig, NatsConfigModule } from '../../../../config'
import { SignatureServiceModule } from '../../../../shared/signature/signature-service.module'
import { SignatureService } from '@app/shared'

const Provider: FactoryProvider = {
  provide: LedgerJetstreamDataSource,
  inject: [NatsConfig, SignatureService],
  useFactory: (natsConfig: NatsConfig, signatureService: SignatureService) =>
    new LedgerJetstreamDataSource(natsConfig, signatureService),
}

@Module({
  imports: [NatsConfigModule, SignatureServiceModule],
  providers: [Provider],
  exports: [Provider],
})
export class LedgerJetstreamDataSourceModule {}
