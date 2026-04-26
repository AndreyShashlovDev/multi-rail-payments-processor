import { Module } from '@nestjs/common'
import { IntegrationJetstreamDataSourceModule } from '../../data-source/nats-jetstream/integration/integration-jetstream-data-source.module'
import { ExternalIntegrationConsumer } from './external-integration.consumer'
import { CurrencyRepositoryModule } from '../../repository/currency/currency-repository.module'

@Module({
  imports: [IntegrationJetstreamDataSourceModule, CurrencyRepositoryModule],
  providers: [ExternalIntegrationConsumer],
  exports: [ExternalIntegrationConsumer],
})
export class ExternalIntegrationConsumerModule {}
