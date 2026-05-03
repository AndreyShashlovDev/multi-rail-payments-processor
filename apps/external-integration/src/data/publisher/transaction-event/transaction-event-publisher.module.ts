import { Module } from '@nestjs/common'
import { CoreJetstreamDataSourceModule } from '../../data-source/nats-jetstream/core-jetstream-data-source.module'
import { TransactionEventPublisher } from './transaction-event.publisher'
import { OutboxRepositoryModule } from '../../repository/outbox/outbox-repository.module'
import { SignatureServiceModule } from '../../../shared/signature/signature-service.module'

@Module({
  imports: [CoreJetstreamDataSourceModule, OutboxRepositoryModule, SignatureServiceModule],
  providers: [TransactionEventPublisher],
  exports: [TransactionEventPublisher],
})
export class TransactionEventPublisherModule {}
