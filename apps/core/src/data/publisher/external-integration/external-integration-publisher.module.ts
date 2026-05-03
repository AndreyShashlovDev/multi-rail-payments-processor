import { Module } from '@nestjs/common'
import { ExternalIntegrationPublisher } from './external-integration.publisher'
import { IntegrationJetstreamDataSourceModule } from '../../data-source/nats-jetstream/integration/integration-jetstream-data-source.module'
import { OutboxRepositoryModule } from '../../repository/outbox/outbox-repository.module'
import { SignatureServiceModule } from '../../../shared/signature/signature-service.module'

@Module({
  imports: [IntegrationJetstreamDataSourceModule, OutboxRepositoryModule, SignatureServiceModule],
  providers: [ExternalIntegrationPublisher],
  exports: [ExternalIntegrationPublisher],
})
export class ExternalIntegrationPublisherModule {}
