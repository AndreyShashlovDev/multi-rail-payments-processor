import { Module } from '@nestjs/common'
import { ExternalIntegrationPublisher } from './external-integration.publisher'
import { IntegrationJetstreamDataSourceModule } from '../../data-source/nats-jetstream/integration/integration-jetstream-data-source.module'
import { OutboxRepositoryModule } from '../../repository/outbox/outbox-repository.module'

@Module({
  imports: [IntegrationJetstreamDataSourceModule, OutboxRepositoryModule],
  providers: [ExternalIntegrationPublisher],
  exports: [ExternalIntegrationPublisher],
})
export class ExternalIntegrationPublisherModule {}
