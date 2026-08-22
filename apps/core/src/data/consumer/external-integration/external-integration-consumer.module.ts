import { Module } from '@nestjs/common'
import { ExternalIntegrationConsumer } from './external-integration.consumer'
import { CurrencyRepositoryModule } from '../../repository/currency/currency-repository.module'
import { IntegrationKafkaDataSourceModule } from '../../data-source/kafka/integration/integration-kafka-data-source.module'

@Module({
  imports: [IntegrationKafkaDataSourceModule, CurrencyRepositoryModule],
  providers: [ExternalIntegrationConsumer],
  exports: [ExternalIntegrationConsumer],
})
export class ExternalIntegrationConsumerModule {}
