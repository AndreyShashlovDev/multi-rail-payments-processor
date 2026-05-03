import { Module } from '@nestjs/common'
import { CoreJetstreamDataSourceModule } from '../../data-source/nats-jetstream/core/core-jetstream-data-source.module'
import { BalanceEventPublisher } from './balance-event.publisher'
import { OutboxRepositoryModule } from '../../repository/outbox/outbox-repository.module'
import { SignatureServiceModule } from '../../../shared/signature/signature-service.module'

@Module({
  imports: [CoreJetstreamDataSourceModule, OutboxRepositoryModule, SignatureServiceModule],
  providers: [BalanceEventPublisher],
  exports: [BalanceEventPublisher],
})
export class BalanceEventPublisherModule {}
