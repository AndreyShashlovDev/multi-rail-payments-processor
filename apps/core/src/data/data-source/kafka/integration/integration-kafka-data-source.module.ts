import { Module, FactoryProvider } from '@nestjs/common'
import { IntegrationKafkaDataSource } from './integration-kafka-data-source.service'
import { AppKafkaConfig, KafkaConfigModule } from '../../../../config'
import { SignatureServiceModule } from '../../../../shared/signature/signature-service.module'
import { SignatureService } from '@app/shared'

const Provider: FactoryProvider = {
  provide: IntegrationKafkaDataSource,
  inject: [AppKafkaConfig, SignatureService],
  useFactory: (kafkaConfig: AppKafkaConfig, signatureService: SignatureService) =>
    new IntegrationKafkaDataSource(kafkaConfig, `${kafkaConfig.groupIdPrefix}-transaction-processor`, signatureService),
}

@Module({
  imports: [KafkaConfigModule, SignatureServiceModule],
  providers: [Provider],
  exports: [Provider],
})
export class IntegrationKafkaDataSourceModule {}
