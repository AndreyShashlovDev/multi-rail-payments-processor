import { Module } from '@nestjs/common'
import { CoreJetstreamDataSourceModule } from '../../data-source/nats-jetstream/core/core-jetstream-data-source.module'
import { OutboxRepositoryModule } from '../../repository/outbox/outbox-repository.module'
import { SignatureServiceModule } from '../../../shared/signature/signature-service.module'
import { BalanceProjectionEventPublisher } from './balance-projection-event.publisher'

@Module({
  imports: [CoreJetstreamDataSourceModule, OutboxRepositoryModule, SignatureServiceModule],
  providers: [BalanceProjectionEventPublisher],
  exports: [BalanceProjectionEventPublisher],
})
export class BalanceProjectionEventPublisherModule {}
