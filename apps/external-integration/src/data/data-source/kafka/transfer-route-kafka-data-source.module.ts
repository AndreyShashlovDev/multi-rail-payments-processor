import { Module, FactoryProvider } from '@nestjs/common'
import { TransferRouteKafkaDataSource } from './transfer-route-kafka-data-source.service'
import { AppKafkaConfig, KafkaConfigModule } from '../../../config'
import { SignatureServiceModule } from '../../../shared/signature/signature-service.module'
import { SignatureService } from '@app/shared'

const Provider: FactoryProvider = {
  provide: TransferRouteKafkaDataSource,
  inject: [AppKafkaConfig, SignatureService],
  useFactory: (kafkaConfig: AppKafkaConfig, signatureService: SignatureService) =>
    new TransferRouteKafkaDataSource(kafkaConfig, kafkaConfig.groupIdPrefix, signatureService),
}

@Module({
  imports: [KafkaConfigModule, SignatureServiceModule],
  providers: [Provider],
  exports: [Provider],
})
export class TransferRouteKafkaDataSourceModule {}
